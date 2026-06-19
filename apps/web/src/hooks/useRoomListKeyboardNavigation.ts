import { useHotkeys, type UseHotkeyDefinition } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";

interface RoomListNavigationRoom {
  shareToken: string;
}

interface UseRoomListKeyboardNavigationOptions {
  isEnabled: boolean;
  rooms: RoomListNavigationRoom[];
  scrollParentRef: RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number) => void;
}

const roomShortcutKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function useRoomListKeyboardNavigation(options: UseRoomListKeyboardNavigationOptions) {
  const navigate = useNavigate();
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(-1);

  useEffect(() => {
    setSelectedRoomIndex((currentIndex) => {
      if (options.rooms.length === 0) {
        return -1;
      }

      if (currentIndex < 0) {
        return 0;
      }

      return Math.min(currentIndex, options.rooms.length - 1);
    });
  }, [options.rooms.length]);

  const openRoom = useCallback((index: number) => {
    const room = options.rooms[index];

    if (room === undefined) {
      return;
    }

    void navigate({ to: "/rooms/$shareToken", params: { shareToken: room.shareToken } });
  }, [navigate, options.rooms]);

  const moveSelection = useCallback((direction: 1 | -1) => {
    if (options.rooms.length === 0) {
      return;
    }

    options.scrollParentRef.current?.focus({ preventScroll: true });
    setSelectedRoomIndex((currentIndex) => {
      const nextIndex = Math.min(Math.max(currentIndex + direction, 0), options.rooms.length - 1);
      options.scrollToIndex(nextIndex);

      return nextIndex;
    });
  }, [options]);

  const hotkeys = useMemo<UseHotkeyDefinition[]>(() => [
    ...roomShortcutKeys.flatMap((hotkey, index) => {
      if (options.rooms[index] === undefined) {
        return [];
      }

      return [{
        hotkey,
        callback: () => openRoom(index),
        options: { meta: { name: `Open room ${index + 1}` } },
      }];
    }),
    {
      hotkey: "ArrowDown",
      callback: () => moveSelection(1),
      options: { meta: { name: "Select next room" } },
    },
    {
      hotkey: "ArrowUp",
      callback: () => moveSelection(-1),
      options: { meta: { name: "Select previous room" } },
    },
    {
      hotkey: "Enter",
      callback: () => openRoom(selectedRoomIndex),
      options: { meta: { name: "Open selected room" } },
    },
  ], [moveSelection, openRoom, options.rooms, selectedRoomIndex]);

  useHotkeys(hotkeys, {
    enabled: options.isEnabled,
    preventDefault: true,
  });

  return { selectedRoomIndex };
}
