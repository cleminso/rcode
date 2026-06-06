import { app } from "@rcode/schema";
import { createContext, type ReactNode, useCallback, useContext, useRef } from "react";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { toast } from "sonner";
import type * as Y from "yjs";
import { type YjsProviderError, useJazzYjsDocument } from "../../hooks/useJazzYjsDocument";

interface RoomContextValue {
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
