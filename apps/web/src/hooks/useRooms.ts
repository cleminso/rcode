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
  const participantRows = useAll(
    session !== null ? app.roomParticipants.where({ session_user_id: session.user_id }) : undefined,
  );
  const roomRows = useAll(app.rooms);
  const metadataRows = useAll(app.roomMetadata);

  const rooms = useMemo(() => {
    if (session === null || participantRows === undefined || roomRows === undefined || metadataRows === undefined) {
      return [];
    }

    const ownParticipantByRoomId = new Map(participantRows.map((participant) => [participant.room_id, participant]));
    const metadataByRoomId = new Map(metadataRows.map((metadata) => [metadata.room_id, metadata]));

    return roomRows
      .flatMap((room) => {
        const ownParticipant = ownParticipantByRoomId.get(room.id) ?? null;
        const isCreator = room.creator_session_user_id === session.user_id;

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
  }, [metadataRows, participantRows, roomRows, session]);

  return {
    isLoading: session !== null && (participantRows === undefined || roomRows === undefined || metadataRows === undefined),
    rooms,
  };
}
