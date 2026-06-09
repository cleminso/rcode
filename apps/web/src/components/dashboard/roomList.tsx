import { app } from "@rcode/schema";
import { Button } from "@rcode/ui/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@rcode/ui/ui/toggle-group";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAll, useSession } from "jazz-tools/react";
import { ActivityIcon, LayersIcon, PlusIcon } from "lucide-react";
import { useMemo, useRef } from "react";
import { RoomListItem, type DashboardRoomListItemRoom } from "./roomListItem";

interface DashboardRoomListRoom extends DashboardRoomListItemRoom {
  lastAccessedAt: Date | null;
}

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

const EmptyState = (
  <div className="rounded-xl border border-dashed p-8 text-center">
    <p className="text-sm text-muted-foreground">Create a room to start coding.</p>
  </div>
);

export function RoomList(props: RoomListProps) {
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
            lastAccessedAt: ownParticipant?.lastAccessedAt ?? null,
          },
        ];
      })
      .toSorted(compareRoomAccess);
  }, [metadataRows, participantRows, roomRows, session]);

  const isLoading = session !== null && (participantRows === undefined || roomRows === undefined || metadataRows === undefined);
  const rowVirtualizer = useVirtualizer({
    count: rooms.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 select-none">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-semibold tracking-[-0.01575em]">Code Rooms</h2>
          <ToggleGroup size="sm" value={["all"]}>
            <ToggleGroupItem value="all">
              <LayersIcon className="size-3" />
              <span>All</span>
            </ToggleGroupItem>
            <ToggleGroupItem disabled value="active" title="Dashboard presence summaries are not wired yet.">
              <ActivityIcon className="size-3" />
              <span>Active</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={props.canCreate === false || props.isCreating === true}
          onClick={props.onCreateRoom}
        >
          <PlusIcon className="size-3" />
          {props.isCreating === true ? "Creating" : "Create"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading === true ? (
          LoadingState
        ) : rooms.length === 0 ? (
          EmptyState
        ) : (
          <div ref={scrollParentRef} className="h-full overflow-y-auto overflow-x-hidden outline-none">
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {virtualItems.map((virtualItem) => {
                const room = rooms[virtualItem.index];

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
                    <RoomListItem room={room} />
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
