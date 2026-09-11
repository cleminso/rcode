import { app } from "@rcode/schema";
import { useAll, useSession } from "jazz-tools/react";
import { useMemo } from "react";

export interface RoomSummary {
  id: string;
  shareToken: string;
  title: string;
  editorLanguage: string;
  isArchived: boolean;
  canUnarchive: boolean;
  creatorSessionUserId: string;
  lastAccessedAt: Date | null;
}

function compareRoomAccess(a: RoomSummary, b: RoomSummary) {
  const left = a.lastAccessedAt?.getTime() ?? 0;
  const right = b.lastAccessedAt?.getTime() ?? 0;

  return right - left;
}

export function useRooms() {
  const session = useSession();
  const sessionUserId = session?.user.account ?? null;
  const participantResult = useAll(
    sessionUserId !== null ? app.roomParticipants.where({ session_user_id: sessionUserId }) : undefined,
  );
  const participantRows = participantResult.data;
  const participantRoomIds = useMemo(() => {
    if (participantRows === undefined) {
      return [];
    }

    return [...new Set(participantRows.map((participant) => participant.room_id))];
  }, [participantRows]);
  const participantRoomsResult = useAll(
    participantRoomIds.length > 0 ? app.rooms.where({ id: { in: participantRoomIds } }) : undefined,
  );
  const participantRoomRows = participantRoomsResult.data;
  // Keep dashboard subscriptions bounded to rooms reachable by the current
  // user instead of subscribing to every readable room and filtering locally
  const creatorRoomsResult = useAll(
    sessionUserId !== null ? app.rooms.where({ creator_session_user_id: sessionUserId }) : undefined,
  );
  const creatorRoomRows = creatorRoomsResult.data;

  const roomRows = useMemo(() => {
    if (session === null) {
      return [];
    }

    if (participantRows === undefined || creatorRoomRows === undefined) {
      return undefined;
    }

    if (participantRoomIds.length > 0 && participantRoomRows === undefined) {
      return undefined;
    }

    const roomsById = new Map((participantRoomRows ?? []).map((room) => [room.id, room]));

    for (const room of creatorRoomRows) {
      roomsById.set(room.id, room);
    }

    return [...roomsById.values()];
  }, [creatorRoomRows, participantRoomIds.length, participantRoomRows, participantRows, session]);
  const roomIds = useMemo(() => roomRows?.map((room) => room.id) ?? [], [roomRows]);
  const metadataResult = useAll(
    roomRows !== undefined && roomIds.length > 0 ? app.roomMetadata.where({ room_id: { in: roomIds } }) : undefined,
  );
  const metadataRows = metadataResult.data;

  const rooms = useMemo(() => {
    if (
      session === null ||
      participantRows === undefined ||
      roomRows === undefined ||
      (roomIds.length > 0 && metadataRows === undefined)
    ) {
      return [];
    }

    const ownParticipantByRoomId = new Map(participantRows.map((participant) => [participant.room_id, participant]));
    const metadataByRoomId = new Map((metadataRows ?? []).map((metadata) => [metadata.room_id, metadata]));

    return roomRows
      .flatMap((room) => {
        const ownParticipant = ownParticipantByRoomId.get(room.id) ?? null;
        const isCreator = room.creator_session_user_id === sessionUserId;

        if (ownParticipant === null && isCreator === false) {
          return [];
        }

        const metadata = metadataByRoomId.get(room.id) ?? null;

        return [
          {
            id: room.id,
            shareToken: room.shareToken,
            title: metadata?.title ?? "",
            editorLanguage: metadata?.editorLanguage ?? "plaintext",
            isArchived: room.archivedAt !== undefined && room.archivedAt !== null,
            canUnarchive: isCreator,
            creatorSessionUserId: room.creator_session_user_id,
            lastAccessedAt: ownParticipant?.lastAccessedAt ?? null,
          },
        ];
      })
      .toSorted(compareRoomAccess);
  }, [metadataRows, participantRows, roomIds.length, roomRows, session, sessionUserId]);

  const error = participantResult.error ?? participantRoomsResult.error ?? creatorRoomsResult.error ?? metadataResult.error;

  if (error !== null) {
    throw error;
  }

  return {
    isLoading:
      session !== null &&
      (participantResult.isLoading === true ||
        creatorRoomsResult.isLoading === true ||
        participantRoomsResult.isLoading === true ||
        metadataResult.isLoading === true ||
        roomRows === undefined),
    rooms,
  };
}
