import Button from "@rcode/ui/button";
import { useHotkeys, type UseHotkeyDefinition } from "@tanstack/react-hotkeys";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { useDashboardPresence } from "../../hooks/useDashboardPresence";
import { useRooms } from "../../hooks/useRooms";
import { RoomListItem, roomListItemHeight } from "./roomListItem";
import type { RoomParticipant } from "./roomParticipantsCell";
import { useRoomListKeyboardNavigation } from "../../hooks/useRoomListKeyboardNavigation";

type RoomListFilter = "all" | "active" | "archived";

const emptyParticipants: RoomParticipant[] = [];

const FilterTab = ({
  active,
  children,
  disabled,
  id,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  id: string;
  onClick: () => void;
}) => (
  <Button
    id={id}
    role="tab"
    aria-selected={active}
    tabIndex={active === true ? 0 : -1}
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
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const { isLoading, rooms } = useRooms();

  const activeCandidateRooms = rooms.filter((room) => room.isArchived === false);
  const roomIds = activeCandidateRooms.map((room) => room.id).toSorted();
  const { activeRoomIds, usersByRoomId } = useDashboardPresence(roomIds);
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

  const rowVirtualizer = useVirtualizer({
    count: displayedRooms.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => roomListItemHeight,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const { selectedRoomIndex } = useRoomListKeyboardNavigation({
    isEnabled: isLoading === false,
    rooms: displayedRooms,
    scrollParentRef,
    scrollToIndex: (index) => rowVirtualizer.scrollToIndex(index, { align: "auto" }),
  });

  const focusFilterTab = (nextFilter: RoomListFilter) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`room-filter-${nextFilter}`)?.focus();
    });
  };

  const selectFilter = (nextFilter: RoomListFilter) => {
    setFilter(nextFilter);
    focusFilterTab(nextFilter);
  };

  const getNextFilter = (direction: 1 | -1) => {
    const filters: RoomListFilter[] = ["all", "active", "archived"];
    const currentIndex = filters.indexOf(filter);

    for (let offset = 1; offset <= filters.length; offset += 1) {
      const nextIndex = (currentIndex + offset * direction + filters.length) % filters.length;
      const nextFilter = filters[nextIndex];

      if (nextFilter === undefined) {
        continue;
      }

      if (nextFilter === "active" && activeRoomIds.size === 0) {
        continue;
      }

      return nextFilter;
    }

    return filter;
  };

  const filterHotkeys = useMemo<UseHotkeyDefinition[]>(() => [
    {
      hotkey: "ArrowRight",
      callback: () => selectFilter(getNextFilter(1)),
      options: { meta: { name: "Select next room filter" } },
    },
    {
      hotkey: "ArrowLeft",
      callback: () => selectFilter(getNextFilter(-1)),
      options: { meta: { name: "Select previous room filter" } },
    },
    {
      hotkey: "Home",
      callback: () => selectFilter("all"),
      options: { meta: { name: "Select all room filter" } },
    },
    {
      hotkey: "End",
      callback: () => selectFilter("archived"),
      options: { meta: { name: "Select archived room filter" } },
    },
  ], [filter, activeRoomIds.size]);

  useHotkeys(filterHotkeys, { preventDefault: true });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>/</span>
          <span>CODE ROOMS</span>
        </div>
        <div role="tablist" aria-label="Room filters" data-room-filter-tablist="true" className="flex items-center gap-4">
          <FilterTab
            active={filter === "all"}
            id="room-filter-all"
            onClick={() => selectFilter("all")}
          >
            ALL
          </FilterTab>
          <FilterTab
            active={filter === "active"}
            disabled={activeRoomIds.size === 0}
            id="room-filter-active"
            onClick={() => selectFilter("active")}
          >
            ACTIVE
          </FilterTab>
          <FilterTab
            active={filter === "archived"}
            id="room-filter-archived"
            onClick={() => selectFilter("archived")}
          >
            ARCHIVED
          </FilterTab>
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mb-1.5 grid shrink-0 grid-cols-[minmax(0,1fr)_120px_116px_max-content] items-center gap-3 border-b border-border pb-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>/</span>
            <span>NAME</span>
          </div>
          <div className="flex justify-self-start items-center gap-1">
            <span>/</span>
            <span>LAST ACTIVITY</span>
          </div>
          <div className="flex justify-self-start items-center gap-1">
            <span>/</span>
            <span>PARTICIPANTS</span>
          </div>
          <div className="flex justify-self-start items-center gap-1">
            <span>/</span>
            <span>CREATOR</span>
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
            <div ref={scrollParentRef} className="h-full overflow-x-hidden overflow-y-auto outline-none" tabIndex={0}>
              <div
                role="list"
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
                      role="listitem"
                      aria-posinset={virtualItem.index + 1}
                      aria-setsize={displayedRooms.length}
                      className="absolute top-0 left-0 w-full"
                      style={{
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <RoomListItem
                        room={room}
                        isSelected={virtualItem.index === selectedRoomIndex}
                        lastAccessedAt={room.lastAccessedAt}
                        participants={usersByRoomId.get(room.id) ?? emptyParticipants}
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
