import { app } from "@rcode/schema";
import { nanoid } from "nanoid";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { hashString } from "../lib/hash";

const ACTIVE_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;
const IDLE_SNAPSHOT_DELAY_MS = 2 * 60 * 1000;
const SNAPSHOT_COALESCE_WINDOW_MS = 2 * 60 * 1000;
const MONACO_TEXT_NAME = "monaco";

interface UseJazzYjsDocumentArgs {
  roomId: string | null;
  ensureParticipant: () => Promise<boolean>;
  onError?: (error: YjsProviderError) => void;
}

interface RemoteUpdateOrigin {
  provider: "jazz";
}

export interface YjsProviderError {
  id: string;
  type: "apply" | "persist";
  title: string;
  description: string;
}

interface YjsRoomRuntime {
  appliedUpdateIds: Set<string>;
  didBootstrap: boolean;
  doc: Y.Doc;
  providerInstanceId: string;
}

const remoteUpdateOrigin: RemoteUpdateOrigin = { provider: "jazz" };

function isByteValue(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) === true && value >= 0 && value <= 255;
}

function reportYjsPersistError(error: unknown) {
  console.error("Failed to persist Yjs update.", error);
}

function reportYjsApplyError(error: unknown) {
  console.error("Failed to apply remote Yjs update.", error);
}

function isAbortSignalAborted(signal: AbortSignal) {
  return signal.aborted === true;
}

function getErrorDescription(error: unknown) {
  if (error instanceof Error === true) {
    return error.message;
  }

  return "Unknown provider error.";
}

function createYjsProviderError(type: YjsProviderError["type"], error: unknown): YjsProviderError {
  return {
    id: nanoid(),
    type,
    title: type === "persist" ? "Editor changes could not be saved" : "Editor changes could not be loaded",
    description: getErrorDescription(error),
  };
}

// Jazz bytes normally hydrate as Uint8Array. The extra shapes keep Y.applyUpdate
// safe across storage/devtool serialization boundaries without guessing strings.
function toYjsUpdate(value: unknown) {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (ArrayBuffer.isView(value) === true) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }

  if (Array.isArray(value) === true) {
    if (value.every(isByteValue) === false) {
      throw new Error("Expected Yjs update array values to be bytes.");
    }

    return Uint8Array.from(value);
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([left], [right]) => Number(left) - Number(right));

    if (entries.length === 0) {
      throw new Error("Expected Yjs update object to contain bytes.");
    }

    if (entries.every(([key, byte], index) => Number(key) === index && isByteValue(byte) === true) === false) {
      throw new Error("Expected Yjs update object values to be contiguous bytes.");
    }

    return Uint8Array.from(entries.map(([, byte]) => Number(byte)));
  }

  throw new Error("Expected a Yjs update byte array.");
}

export function useJazzYjsDocument(args: UseJazzYjsDocumentArgs) {
  const { ensureParticipant, onError, roomId } = args;
  const db = useDb();
  const session = useSession();
  // Create the room doc during render so consumers bind to the same doc that
  // receives bootstrap rows; effect-time replacement can target stale docs.
  const [runtime] = useState<YjsRoomRuntime>(() => ({
    appliedUpdateIds: new Set<string>(),
    didBootstrap: false,
    doc: new Y.Doc(),
    providerInstanceId: nanoid(),
  }));
  const doc = runtime.doc;
  const providerInstanceId = runtime.providerInstanceId;
  const [readyRoomId, setReadyRoomId] = useState<string | null>(null);
  const isReady = roomId !== null && readyRoomId === roomId;
  const canEditSession =
    session !== null &&
    (session.authMode === "local-first" || session.authMode === "external");
  const sessionUserId = session?.user_id ?? null;
  const hasLocalEditsRef = useRef(false);
  const localEditVersionRef = useRef(0);

  // Use refs for callbacks/handles that can change without needing to restart
  // the room-scoped persist/snapshot effect.
  const dbRef = useRef(db);
  dbRef.current = db;
  const ensureParticipantRef = useRef(ensureParticipant);
  ensureParticipantRef.current = ensureParticipant;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const snapshotRows = useAll(
    roomId !== null ? app.roomYjsSnapshots.where({ room_id: roomId }) : undefined,
  );
  const snapshotRowsRef = useRef(snapshotRows);
  snapshotRowsRef.current = snapshotRows;
  const updateRows = useAll(roomId !== null ? app.roomYjsUpdates.where({ room_id: roomId }) : undefined);

  useEffect(() => {
    return () => {
      doc.destroy();
    };
  }, [doc]);

  useEffect(() => {
    if (roomId === null || snapshotRows === undefined || updateRows === undefined) {
      setReadyRoomId(null);
      return;
    }

    if (runtime.didBootstrap === false) {
      const latestSnapshot = snapshotRows.reduce<(typeof snapshotRows)[number] | null>((latest, snapshot) => {
        if (latest === null) {
          return snapshot;
        }

        return snapshot.createdAt > latest.createdAt ? snapshot : latest;
      }, null);

      if (latestSnapshot !== null) {
        try {
          Y.applyUpdate(doc, toYjsUpdate(latestSnapshot.state), remoteUpdateOrigin);
        } catch (error) {
          reportYjsApplyError(error);

          if (onError !== undefined) {
            onError(createYjsProviderError("apply", error));
          }
        }
      }

      runtime.didBootstrap = true;
    }

    for (const updateRow of updateRows) {
      if (runtime.appliedUpdateIds.has(updateRow.id) === true) {
        continue;
      }

      if (updateRow.provider_instance_id === runtime.providerInstanceId) {
        runtime.appliedUpdateIds.add(updateRow.id);
        continue;
      }

      try {
        Y.applyUpdate(doc, toYjsUpdate(updateRow.update), remoteUpdateOrigin);
        runtime.appliedUpdateIds.add(updateRow.id);
      } catch (error) {
        reportYjsApplyError(error);

        if (onError !== undefined) {
          onError(createYjsProviderError("apply", error));
        }
      }
    }

    setReadyRoomId(roomId);
  }, [roomId, doc, onError, runtime, snapshotRows, updateRows]);

  // Combined effect for both update persistence and snapshot creation. Both
  // share the same guard conditions and cleanup logic, and snapshot creation
  // depends on the edit flag set by the persist listener.
  useEffect(() => {
    if (roomId === null || isReady === false || canEditSession === false || sessionUserId === null) {
      return;
    }

    const activeRoomId = roomId;
    const activeDoc = doc;
    const activeProviderInstanceId = providerInstanceId;
    const activeSessionUserId = sessionUserId;
    const abortController = new AbortController();
    const { signal } = abortController;
    let activeSnapshotIntervalId: ReturnType<typeof setInterval> | null = null;
    let idleSnapshotTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isSnapshotInFlight = false;

    const clearActiveSnapshotInterval = () => {
      if (activeSnapshotIntervalId === null) {
        return;
      }

      clearInterval(activeSnapshotIntervalId);
      activeSnapshotIntervalId = null;
    };

    const clearIdleSnapshotTimeout = () => {
      if (idleSnapshotTimeoutId === null) {
        return;
      }

      clearTimeout(idleSnapshotTimeoutId);
      idleSnapshotTimeoutId = null;
    };

    const createSnapshot = async () => {
      if (
        hasLocalEditsRef.current === false ||
        isAbortSignalAborted(signal) === true ||
        isSnapshotInFlight === true
      ) {
        return;
      }

      isSnapshotInFlight = true;

      try {
        const canWrite = await ensureParticipantRef.current();

        if (canWrite === false || isAbortSignalAborted(signal) === true) {
          return;
        }

        const includedEditVersion = localEditVersionRef.current;
        const currentSnapshotRows = snapshotRowsRef.current;
        const currentText = activeDoc.getText(MONACO_TEXT_NAME).toString();
        const state = Y.encodeStateAsUpdate(activeDoc);
        const stateVector = Y.encodeStateVector(activeDoc);
        const textHash = await hashString(currentText);

        if (isAbortSignalAborted(signal) === true) {
          return;
        }

        if (currentSnapshotRows !== undefined) {
          const latestSnapshot = currentSnapshotRows.reduce<(typeof currentSnapshotRows)[number] | null>(
            (latest, snapshot) => {
              if (latest === null) {
                return snapshot;
              }

              return snapshot.createdAt > latest.createdAt ? snapshot : latest;
            },
            null,
          );

          if (latestSnapshot !== null) {
            const latestSnapshotAge = Date.now() - latestSnapshot.createdAt.getTime();

            if (latestSnapshotAge <= SNAPSHOT_COALESCE_WINDOW_MS) {
              if (latestSnapshot.textHash === textHash) {
                if (
                  isAbortSignalAborted(signal) === false &&
                  localEditVersionRef.current === includedEditVersion
                ) {
                  hasLocalEditsRef.current = false;
                }

                return;
              }
            }
          }
        }

        await dbRef.current
          .insert(app.roomYjsSnapshots, {
            room_id: activeRoomId,
            state,
            stateVector,
            textHash,
            session_user_id: activeSessionUserId,
            createdAt: new Date(),
          })
          .wait({ tier: "local" });

        if (
          isAbortSignalAborted(signal) === false &&
          localEditVersionRef.current === includedEditVersion
        ) {
          hasLocalEditsRef.current = false;
        }
      } catch (error) {
        console.error("Failed to create Yjs snapshot.", error);
      } finally {
        isSnapshotInFlight = false;
      }
    };

    const ensureActiveSnapshotInterval = () => {
      if (activeSnapshotIntervalId !== null) {
        return;
      }

      activeSnapshotIntervalId = setInterval(() => {
        void createSnapshot();
      }, ACTIVE_SNAPSHOT_INTERVAL_MS);
    };

    const scheduleIdleSnapshot = () => {
      clearIdleSnapshotTimeout();

      idleSnapshotTimeoutId = setTimeout(() => {
        idleSnapshotTimeoutId = null;

        void createSnapshot().finally(() => {
          if (hasLocalEditsRef.current === false) {
            clearActiveSnapshotInterval();
          }
        });
      }, IDLE_SNAPSHOT_DELAY_MS);
    };

    const monacoText = activeDoc.getText(MONACO_TEXT_NAME);
    const scheduleSnapshotFromLocalTextChange: Parameters<Y.Text["observe"]>[0] = (_event, transaction) => {
      if (transaction.origin === remoteUpdateOrigin) {
        return;
      }

      hasLocalEditsRef.current = true;
      localEditVersionRef.current += 1;
      ensureActiveSnapshotInterval();
      scheduleIdleSnapshot();
    };

    const persistUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === remoteUpdateOrigin) {
        return;
      }

      const yClientId = String(activeDoc.clientID);
      const updateCopy = new Uint8Array(update);

      void (async () => {
        try {
          const canWrite = await ensureParticipantRef.current();

          if (canWrite === false || isAbortSignalAborted(signal) === true) {
            return;
          }

          await dbRef.current
            .insert(app.roomYjsUpdates, {
              room_id: activeRoomId,
              update: updateCopy,
              session_user_id: activeSessionUserId,
              y_client_id: yClientId,
              provider_instance_id: activeProviderInstanceId,
              createdAt: new Date(),
            })
            .wait({ tier: "edge" });
        } catch (error) {
          reportYjsPersistError(error);

          if (isAbortSignalAborted(signal) === false && onErrorRef.current !== undefined) {
            onErrorRef.current(createYjsProviderError("persist", error));
          }
        }
      })();
    };

    monacoText.observe(scheduleSnapshotFromLocalTextChange);
    activeDoc.on("update", persistUpdate);

    return () => {
      abortController.abort();
      monacoText.unobserve(scheduleSnapshotFromLocalTextChange);
      activeDoc.off("update", persistUpdate);
      clearActiveSnapshotInterval();
      clearIdleSnapshotTimeout();
    };
  }, [canEditSession, doc, isReady, providerInstanceId, roomId, sessionUserId]);

  return {
    ydoc: doc,
    isYjsReady: isReady,
  };
}
