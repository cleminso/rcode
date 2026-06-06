import { app } from "@rcode/schema";
import { nanoid } from "nanoid";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";

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
  const runtime = useMemo<YjsRoomRuntime>(
    () => ({
      appliedUpdateIds: new Set<string>(),
      didBootstrap: false,
      doc: new Y.Doc(),
      providerInstanceId: nanoid(),
    }),
    [roomId],
  );
  const doc = runtime.doc;
  const [readyRoomId, setReadyRoomId] = useState<string | null>(null);
  const isReady = roomId !== null && readyRoomId === roomId;

  const snapshotRows = useAll(
    roomId !== null ? app.roomYjsSnapshots.where({ room_id: roomId }) : undefined,
  );
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

  useEffect(() => {
    if (roomId === null || isReady === false || session === null) {
      return;
    }

    const activeRoomId = roomId;

    const canEditSession = session.authMode === "local-first" || session.authMode === "external";

    if (canEditSession === false) {
      return;
    }

    let isActive = true;

    const persistUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === remoteUpdateOrigin) {
        return;
      }

      const sessionUserId = session.user_id;
      const yClientId = String(doc.clientID);
      const providerInstanceId = runtime.providerInstanceId;
      const updateCopy = new Uint8Array(update);

      void (async () => {
        try {
          const canWrite = await ensureParticipant();

          if (canWrite === false) {
            return;
          }

          await db
            .insert(app.roomYjsUpdates, {
              room_id: activeRoomId,
              update: updateCopy,
              session_user_id: sessionUserId,
              y_client_id: yClientId,
              provider_instance_id: providerInstanceId,
              createdAt: new Date(),
            })
            .wait({ tier: "edge" });
        } catch (error) {
          reportYjsPersistError(error);

          if (isActive === true && onError !== undefined) {
            onError(createYjsProviderError("persist", error));
          }
        }
      })();
    };

    doc.on("update", persistUpdate);

    return () => {
      isActive = false;
      doc.off("update", persistUpdate);
    };
  }, [db, doc, ensureParticipant, isReady, onError, roomId, runtime, session]);

  return {
    ydoc: doc,
    isYjsReady: isReady,
  };
}
