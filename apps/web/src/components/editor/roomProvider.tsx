import { app } from "@rcode/schema";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef } from "react";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { toast } from "sonner";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import {
  awarenessConnectionClosedOrigin,
  type AwarenessState,
  useRoomAwareness,
} from "../../hooks/useRoomAwareness";
import { type YjsProviderError, useJazzYjsDocument } from "../../hooks/useJazzYjsDocument";

interface RoomContextValue {
  awareness: Awareness;
  shareToken: string;
  roomId: string | null;
  canEdit: boolean;
  title: string;
  editorLanguage: string;
  isLoading: boolean;
  isYjsReady: boolean;
  ydoc: Y.Doc;
  updateTitle: (title: string) => Promise<void>;
  updateEditorLanguage: (editorLanguage: string) => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | null>(null);
const PRESENCE_TOAST_HYDRATION_DELAY_MS = 500;
const PRESENCE_LEAVE_TOAST_DELAY_MS = 100;

interface RoomProviderProps {
  shareToken: string;
  children: ReactNode;
}

export function RoomProvider(props: RoomProviderProps) {
  const db = useDb();
  const session = useSession();
  // Share-token collaborators gain write access through this durable row, and
  // the ref dedupes concurrent metadata/Yjs writes for the same in-flight insert.
  const participantWriteRef = useRef<Promise<void> | null>(null);
  const participantAccessUpdateKeyRef = useRef<string | null>(null);
  const rooms = useAll(app.rooms.where({ shareToken: props.shareToken }).limit(1));
  const room = rooms?.[0] ?? null;
  const metadataRows = useAll(room !== null ? app.roomMetadata.where({ room_id: room.id }).limit(1) : undefined);
  const metadata = metadataRows?.[0] ?? null;
  const canEditSession =
    session !== null &&
    (session.authMode === "local-first" || session.authMode === "external");
  const participantRows = useAll(
    room !== null && canEditSession === true
      ? app.roomParticipants.where({ room_id: room.id, session_user_id: session.user_id }).limit(1)
      : undefined,
  );
  const participant = participantRows?.[0] ?? null;
  const isParticipantLoading = room !== null && canEditSession === true && participantRows === undefined;
  const isLoading =
    rooms === undefined || (room !== null && metadataRows === undefined) || isParticipantLoading === true;

  const ensureParticipant = useCallback(async () => {
    if (canEditSession === false || room === null || session === null) {
      return false;
    }

    if (participant !== null) {
      return true;
    }

    if (participantRows === undefined) {
      return false;
    }

    if (participantWriteRef.current === null) {
      participantWriteRef.current = db
        .insert(app.roomParticipants, {
          room_id: room.id,
          session_user_id: session.user_id,
          lastAccessedAt: new Date(),
        })
        .wait({ tier: "edge" })
        .then(() => undefined)
        .finally(() => {
          participantWriteRef.current = null;
        });
    }

    await participantWriteRef.current;
    return true;
  }, [canEditSession, db, participant, participantRows, room, session]);

  useEffect(() => {
    if (isLoading === true) {
      return;
    }

    void ensureParticipant();
  }, [ensureParticipant, isLoading]);

  useEffect(() => {
    if (canEditSession === false || participant === null || session === null) {
      return;
    }

    const updateKey = `${participant.id}:${session.user_id}`;

    if (participantAccessUpdateKeyRef.current === updateKey) {
      return;
    }

    participantAccessUpdateKeyRef.current = updateKey;

    void db
      .update(app.roomParticipants, participant.id, {
        lastAccessedAt: new Date(),
      })
      .wait({ tier: "edge" })
      .catch((caughtError: unknown) => {
        participantAccessUpdateKeyRef.current = null;
        console.error("Failed to update room access.", caughtError);
      });
  }, [canEditSession, db, participant, session]);

  const notifyYjsProviderError = useCallback((error: YjsProviderError) => {
    toast.error(error.title, {
      id: error.id,
      description: error.description,
    });
  }, []);

  const { isYjsReady, ydoc } = useJazzYjsDocument({
    // Expose roomId only with room metadata and participant state loaded;
    // otherwise the editor can bootstrap without its write permission path.
    roomId: isLoading === false ? (room?.id ?? null) : null,
    ensureParticipant,
    onError: notifyYjsProviderError,
  });
  const awareness = useRoomAwareness({
    isReady: isYjsReady,
    roomId: room?.id ?? null,
    ydoc,
  });

  useEffect(() => {
    if (isYjsReady === false) {
      return;
    }

    const knownDisplayNames = new Map<number, string>();
    const leaveToastTimeouts = new Map<number, number>();
    let canShowPresenceToasts = false;

    const getDisplayName = (clientId: number) => {
      const state = awareness.getStates().get(clientId) as AwarenessState | undefined;
      return state?.user?.displayName ?? knownDisplayNames.get(clientId) ?? "Someone";
    };

    const rememberDisplayNames = () => {
      for (const [clientId, state] of awareness.getStates()) {
        const typedState = state as AwarenessState;

        if (typedState.user?.displayName !== undefined) {
          knownDisplayNames.set(clientId, typedState.user.displayName);
        }
      }
    };

    rememberDisplayNames();

    // TODO: Replace this hydration workaround with an explicit initial-awareness-sync signal.
    const hydrationTimeout = window.setTimeout(() => {
      rememberDisplayNames();
      canShowPresenceToasts = true;
    }, PRESENCE_TOAST_HYDRATION_DELAY_MS);

    const handleChange = (change: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
      if (origin === awarenessConnectionClosedOrigin) {
        return;
      }

      for (const clientId of change.updated) {
        const state = awareness.getStates().get(clientId) as AwarenessState | undefined;

        if (state?.user?.displayName !== undefined) {
          knownDisplayNames.set(clientId, state.user.displayName);
        }
      }

      for (const clientId of change.added) {
        const pendingLeaveToast = leaveToastTimeouts.get(clientId);

        if (pendingLeaveToast !== undefined) {
          window.clearTimeout(pendingLeaveToast);
          leaveToastTimeouts.delete(clientId);
        }

        const displayName = getDisplayName(clientId);
        knownDisplayNames.set(clientId, displayName);

        if (canShowPresenceToasts === true && clientId !== awareness.clientID) {
          toast.info(`${displayName} joined the room.`);
        }
      }

      for (const clientId of change.removed) {
        if (clientId === awareness.clientID) {
          continue;
        }

        const displayName = knownDisplayNames.get(clientId) ?? "Someone";
        const timeoutId = window.setTimeout(() => {
          leaveToastTimeouts.delete(clientId);

          if (awareness.getStates().has(clientId) === false) {
            knownDisplayNames.delete(clientId);

            if (canShowPresenceToasts === true) {
              toast.info(`${displayName} left the room.`);
            }
          }
        }, PRESENCE_LEAVE_TOAST_DELAY_MS);
        leaveToastTimeouts.set(clientId, timeoutId);
      }
    };

    awareness.on("change", handleChange);

    return () => {
      window.clearTimeout(hydrationTimeout);
      for (const timeoutId of leaveToastTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }

      awareness.off("change", handleChange);
    };
  }, [awareness, isYjsReady]);

  const updateMetadata = async (metadataPatch: { title?: string; editorLanguage?: string }) => {
    if (isLoading === true || room === null) {
      return;
    }

    const canUpdateMetadata = await ensureParticipant();

    if (canUpdateMetadata === false) {
      return;
    }

    if (metadata !== null) {
      await db.update(app.roomMetadata, metadata.id, metadataPatch).wait({ tier: "edge" });
      return;
    }

    await db
      .insert(app.roomMetadata, {
        room_id: room.id,
        title: metadataPatch.title ?? "",
        editorLanguage: metadataPatch.editorLanguage ?? "plaintext",
      })
      .wait({ tier: "edge" });
  };

  const updateTitle = async (title: string) => {
    await updateMetadata({ title });
  };

  const updateEditorLanguage = async (editorLanguage: string) => {
    await updateMetadata({ editorLanguage });
  };

  return (
    <RoomContext.Provider
      value={{
        awareness,
        shareToken: props.shareToken,
        roomId: room?.id ?? null,
        canEdit: canEditSession,
        title: metadata?.title ?? "",
        editorLanguage: metadata?.editorLanguage ?? "plaintext",
        isLoading,
        isYjsReady,
        ydoc,
        updateTitle,
        updateEditorLanguage,
      }}
    >
      {props.children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const room = useContext(RoomContext);

  if (room === null) {
    throw new Error("useRoom must be used inside RoomProvider.");
  }

  return room;
}
