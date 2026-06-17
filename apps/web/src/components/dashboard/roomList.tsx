import { app } from "@rcode/schema";
import Button from "@rcode/ui/button";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAll, useSession } from "jazz-tools/react";
import { useMemo, useRef, useState } from "react";
import { useDashboardPresence } from "../../hooks/useDashboardPresence";
import { RoomListItem, roomListItemHeight, type DashboardRoomListItemRoom } from "./roomListItem";

interface DashboardRoomListRoom extends DashboardRoomListItemRoom {
  lastAccessedAt: Date | null;
}

type RoomListFilter = "all" | "active" | "archived";

function compareRoomAccess(a: DashboardRoomListRoom, b: DashboardRoomListRoom) {
  const left = a.lastAccessedAt?.getTime() ?? 0;
  const right = b.lastAccessedAt?.getTime() ?? 0;

  return right - left;
}

const FilterTab = ({
  active,
  children,
  disabled,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <Button
    variant={active === true ? "accent" : "ghost"}
    size="none"
    className="text-xs"
    disabled={disabled === true}
    onClick={onClick}
  >
    <span>/</span>
    <span>{children}</span>
  </Button>
);

export function RoomList() {
  const [filter, setFilter] = useState<RoomListFilter>("all");
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
  const { activeRoomIds, userCountByRoomId } = useDashboardPresence(roomIds);
  const displayedRooms = rooms.filter((room) => {
    if (filter === "archived") {
      return room.isArchived === true;
    }

    if (room.isArchived === true) {
      return false;
    }

    if (filter === "active") {
      return activeRoomIds.has(room.id);
    }

    return true;
  });
  const isLoading = session !== null && (participantRows === undefined || roomRows === undefined || metadataRows === undefined);
  const rowVirtualizer = useVirtualizer({
    count: displayedRooms.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => roomListItemHeight,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>/</span>
          <span>CODE ROOMS</span>
        </div>
        <div className="flex items-center gap-4">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            ALL
          </FilterTab>
          <FilterTab active={filter === "active"} disabled={activeRoomIds.size === 0} onClick={() => setFilter("active")}>
            ACTIVE
          </FilterTab>
          <FilterTab active={filter === "archived"} onClick={() => setFilter("archived")}>
            ARCHIVED
          </FilterTab>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-[minmax(0,1fr)_160px_132px] items-center gap-3 border-b border-border pb-1.5 mb-1.5 text-xs  text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>/</span>
            <span>NAME</span>
          </div>
          <div className="flex items-center gap-1">
            <span>/</span>
            <span>LAST ACTIVITY</span>
          </div>
          <div className="flex justify-self-end items-center gap-1">
            <span>/</span>
            <span>PARTICIPANTS</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {isLoading === true ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading rooms.
            </div>
          ) : displayedRooms.length === 0 ? (
            <div className="py-8 text-center font-sans font-normal text-md text-muted-foreground">
              {filter === "active"
                ? "No active rooms right now."
                : filter === "archived"
                  ? "No archived rooms."
                  : "Create a room to start coding."}
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
                      <RoomListItem
                        room={room}
                        lastAccessedAt={room.lastAccessedAt}
                        participantCount={userCountByRoomId.get(room.id) ?? 0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
