import { app } from "@rcode/schema";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAll, useDb, useSession } from "jazz-tools/react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import { useRoomAwareness } from "../../hooks/useRoomAwareness";
import { type YjsProviderError, useJazzYjsDocument } from "../../hooks/useJazzYjsDocument";
import { type RoomPresence, type RoomPresenceUser, useRoomPresence } from "../../hooks/useRoomPresence";
import { useCurrentProfile } from "../../hooks/useCurrentProfile";
import { useRoomLookup } from "../../hooks/useRoomLookup";
import { toasts } from "../../lib/toasts";

interface RoomContextValue {
  awareness: Awareness;
  currentProfile: ReturnType<typeof useCurrentProfile>;
  shareToken: string;
  staticToken: string | null;
  roomId: string | null;
  canEdit: boolean;
  isArchived: boolean;
  isCreator: boolean;
  roomExists: boolean;
  roomPresence: RoomPresence;
  title: string;
  editorLanguage: string;
  isLoading: boolean;
  isYjsReady: boolean;
  ydoc: Y.Doc;
  archiveRoom: () => Promise<void>;
  unarchiveRoom: () => Promise<void>;
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
  const participantAccessUpdateKeyRef = useRef<string | null>(null);
  const knownPresenceUsersRef = useRef<Map<string, string>>(new Map());
  const didHydratePresenceToastsRef = useRef(false);
  const [readyParticipantAccessKey, setReadyParticipantAccessKey] = useState<string | null>(null);
  const isSessionLoading = session === null;
  const roomLookup = useRoomLookup({ tokenType: "share", token: props.shareToken, enabled: isSessionLoading === false });
  const room = roomLookup.room;
  const metadataRows = useAll(room !== null ? app.roomMetadata.where({ room_id: room.id }).limit(1) : undefined);
  const metadata = metadataRows?.[0] ?? null;
  const canEditSession =
    session !== null &&
    (session.authMode === "local-first" || session.authMode === "external");
  const isArchived = room?.archivedAt !== undefined && room.archivedAt !== null;
  const isCreator = session !== null && room?.creator_session_user_id === session.user_id;
  const participantAccessKey = room !== null && canEditSession === true && isArchived === false && isCreator === false && session !== null
    ? `${room.id}:${session.user_id}`
    : null;
  const participantRows = useAll(
    participantAccessKey !== null && room !== null && session !== null
      ? app.roomParticipants.where({ room_id: room.id, session_user_id: session.user_id }).limit(1)
      : undefined,
  );
  const participant = participantRows?.[0] ?? null;
  const participantAccessReady = participantAccessKey === null || participant !== null || readyParticipantAccessKey === participantAccessKey;
  const isParticipantLoading = participantAccessKey !== null && (participantRows === undefined || participantAccessReady === false);
  const isLoading =
    isSessionLoading === true ||
    roomLookup.isLoading === true ||
    (room !== null && metadataRows === undefined) ||
    isParticipantLoading === true;

  const ensureParticipant = useCallback(async () => {
    if (canEditSession === false || room === null || session === null || isArchived === true) {
      return false;
    }

    if (isCreator === true || participant !== null || (participantAccessKey !== null && readyParticipantAccessKey === participantAccessKey)) {
      return true;
    }

    if (participantAccessKey === null || participantRows === undefined) {
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
        .then(() => {
          setReadyParticipantAccessKey(participantAccessKey);
        })
        .finally(() => {
          participantWriteRef.current = null;
        });
    }

    await participantWriteRef.current;
    return true;
  }, [canEditSession, db, isArchived, isCreator, participant, participantAccessKey, participantRows, readyParticipantAccessKey, room, session]);

  useEffect(() => {
    if (isSessionLoading === true || roomLookup.isLoading === true || (room !== null && metadataRows === undefined) || participantRows === undefined || participantAccessKey === null || participantAccessReady === true) {
      return;
    }

    void ensureParticipant().catch((caughtError: unknown) => {
      console.error("Failed to create room participant access.", caughtError);
    });
  }, [ensureParticipant, isSessionLoading, metadataRows, participantAccessKey, participantAccessReady, participantRows, room, roomLookup.isLoading]);

  useEffect(() => {
    if (canEditSession === false || participant === null || session === null || isArchived === true) {
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
  }, [canEditSession, db, isArchived, participant, session]);

  const notifyYjsProviderError = useCallback((error: YjsProviderError) => {
    toasts.rooms.providerError(error);
  }, []);

  const canAccessContent = room !== null && (isArchived === false || isCreator === true);
  const currentProfile = useCurrentProfile({
    autoCreate: isLoading === false && canAccessContent === true,
  });
  const { isYjsReady, ydoc } = useJazzYjsDocument({
    // Expose roomId only with room metadata and participant state loaded;
    // otherwise the editor can bootstrap without its write permission path.
    // Creators can still load archived rooms in read-only mode.
    roomId: isLoading === false && canAccessContent === true ? room.id : null,
    ensureParticipant,
    onError: notifyYjsProviderError,
  });
  const awareness = useRoomAwareness({
    displayName: currentProfile.displayName,
    isReady: isYjsReady === true && currentProfile.profile !== null && isArchived === false,
    roomId: room?.id ?? null,
    ydoc,
  });
  // Only subscribe to presence once the Yjs document is ready and the room is
  // not archived. Before that, there's no editor session to show presence for.
  const presenceRoomId = isYjsReady === true && isArchived === false ? (room?.id ?? null) : null;
  const localPresenceUser: RoomPresenceUser | undefined = currentProfile.sessionUserId === null || currentProfile.displayName === null
    ? undefined
    : {
        displayName: currentProfile.displayName,
        isLocal: true,
        sessionUserId: currentProfile.sessionUserId,
      };
  const roomPresence = useRoomPresence(presenceRoomId, session?.user_id ?? null, localPresenceUser);

  // Reset toast tracking state when switching rooms so the previous room's
  // known users don't trigger spurious "left" toasts.
  useEffect(() => {
    knownPresenceUsersRef.current = new Map();
    didHydratePresenceToastsRef.current = false;
  }, [presenceRoomId]);

  // Show join/leave toasts based on server-backed user-level presence (not
  // awareness clients). The first SSE event is treated as hydration — it
  // seeds the known users without firing toasts for users who were already
  // in the room before this tab connected.
  useEffect(() => {
    if (isYjsReady === false || roomPresence.isLoaded === false) {
      return;
    }

    const previousUsers = knownPresenceUsersRef.current;
    const nextUsers = new Map(roomPresence.users.map((user) => [user.sessionUserId, user.displayName]));

    if (didHydratePresenceToastsRef.current === false) {
      knownPresenceUsersRef.current = nextUsers;
      didHydratePresenceToastsRef.current = true;
      return;
    }

    for (const user of roomPresence.users) {
      if (previousUsers.has(user.sessionUserId) === false && user.isLocal === false) {
        toasts.rooms.userJoined(user.displayName);
      }
    }

    for (const [sessionUserId, displayName] of previousUsers) {
      if (nextUsers.has(sessionUserId) === false && sessionUserId !== session?.user_id) {
        toasts.rooms.userLeft(displayName);
      }
    }

    knownPresenceUsersRef.current = nextUsers;
  }, [isYjsReady, roomPresence, session?.user_id]);

  const updateMetadata = async (metadataPatch: { title?: string; editorLanguage?: string }) => {
    if (isLoading === true || room === null || isArchived === true || canEditSession === false) {
      return;
    }

    const canUpdateMetadata = await ensureParticipant();

    if (canUpdateMetadata === false || metadata === null) {
      return;
    }

    await db.update(app.roomMetadata, metadata.id, metadataPatch).wait({ tier: "edge" });
  };

  const updateTitle = async (title: string) => {
    await updateMetadata({ title });
  };

  const updateEditorLanguage = async (editorLanguage: string) => {
    await updateMetadata({ editorLanguage });
  };

  const archiveRoom = async () => {
    if (room === null || isCreator === false || session === null) {
      return;
    }

    await db
      .update(app.rooms, room.id, {
        archivedAt: new Date(),
        archivedBySessionUserId: session.user_id,
      })
      .wait({ tier: "edge" });
  };

  const unarchiveRoom = async () => {
    if (room === null || isCreator === false) {
      return;
    }

    await db
      .update(app.rooms, room.id, {
        archivedAt: null,
        archivedBySessionUserId: null,
      })
      .wait({ tier: "edge" });
  };

  return (
    <RoomContext.Provider
      value={{
        awareness,
        currentProfile,
        shareToken: props.shareToken,
        staticToken: room?.staticToken ?? null,
        roomId: room?.id ?? null,
        roomPresence,
        canEdit: canEditSession === true && isArchived === false,
        isArchived,
        isCreator,
        roomExists: roomLookup.isResolvedEmpty === false && room !== null,
        title: metadata?.title ?? "",
        editorLanguage: metadata?.editorLanguage ?? "plaintext",
        isLoading,
        isYjsReady,
        ydoc,
        archiveRoom,
        unarchiveRoom,
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
