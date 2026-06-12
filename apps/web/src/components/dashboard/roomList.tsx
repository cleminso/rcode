import { app } from "@rcode/schema";
import { Button } from "@rcode/ui/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@rcode/ui/ui/toggle-group";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { useMemo, useRef, useState } from "react";
import { useDashboardPresence } from "../../hooks/useDashboardPresence";
import { RoomListItem, type DashboardRoomListItemRoom } from "./roomListItem";

interface DashboardRoomListRoom extends DashboardRoomListItemRoom {
  lastAccessedAt: Date | null;
}

type RoomListFilter = "all" | "active" | "archived";

interface RoomListProps {
  canCreate: boolean;
  isCreating: boolean;
  onCreateRoom: () => void;
}

function compareRoomAccess(a: DashboardRoomListRoom, b: DashboardRoomListRoom) {
  const left = a.lastAccessedAt?.getTime() ?? 0;
  const right = b.lastAccessedAt?.getTime() ?? 0;

  return right - left;
}

const LoadingState = (
  <div className="rounded-xl border border-dashed p-8 text-center">
    <p className="text-sm text-muted-foreground">Loading rooms.</p>
  </div>
);

export function RoomList(props: RoomListProps) {
  const [filter, setFilter] = useState<readonly RoomListFilter[]>(["all"]);
  const db = useDb();
  const session = useSession();
  const scrollParentRef = useRef<HTMLDivElement>(null);
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
            lastAccessedAt: ownParticipant?.lastAccessedAt ?? null,
          },
        ];
      })
      .toSorted(compareRoomAccess);
  }, [metadataRows, participantRows, roomRows, session]);

  const activeCandidateRooms = rooms.filter((room) => room.isArchived === false);
  const roomIds = activeCandidateRooms.map((room) => room.id);
  const { activeRoomIds } = useDashboardPresence(roomIds);
  const displayedRooms = rooms.filter((room) => {
    if (filter[0] === "archived") {
      return room.isArchived === true;
    }

    if (room.isArchived === true) {
      return false;
    }

    if (filter[0] === "active") {
      return activeRoomIds.has(room.id);
    }

    return true;
  });
  const isLoading = session !== null && (participantRows === undefined || roomRows === undefined || metadataRows === undefined);
  const rowVirtualizer = useVirtualizer({
    count: displayedRooms.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const handleUnarchive = (roomId: string) => {
    void db
      .update(app.rooms, roomId, {
        archivedAt: null,
        archivedBySessionUserId: null,
      })
      .wait({ tier: "edge" });
  };

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 select-none">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-semibold tracking-[-0.01575em]">Code Rooms</h2>
          <ToggleGroup
            size="sm"
            value={filter}
            onValueChange={(value) => {
              const selected = value?.[0];

              if (selected === "all" || selected === "active" || selected === "archived") {
                setFilter([selected]);
              }
            }}
          >
            <ToggleGroupItem value="all">
              <span>All</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="active" disabled={activeRoomIds.size === 0}>
              <span>Active</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="archived">
              <span>Archived</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={props.canCreate === false || props.isCreating === true}
          onClick={props.onCreateRoom}
        >
          {props.isCreating === true ? "Creating" : "Create"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading === true ? (
          LoadingState
        ) : displayedRooms.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {filter[0] === "active"
                ? "No active rooms right now."
                : filter[0] === "archived"
                  ? "No archived rooms."
                  : "Create a room to start coding."}
            </p>
          </div>
        ) : (
          <div ref={scrollParentRef} className="h-full overflow-y-auto overflow-x-hidden outline-none">
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {virtualItems.map((virtualItem) => {
                const room = displayedRooms[virtualItem.index];

                if (room === undefined) {
                  return null;
                }

                return (
                  <div
                    key={room.id}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <RoomListItem room={room} onUnarchive={handleUnarchive} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
