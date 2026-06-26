import { getLanguage, type Language } from "@rcode/icons/languages";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rcode/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useRooms, type RoomSummary } from "../../hooks/useRooms";
import { toasts } from "../../lib/toasts";
import { LanguageCommandItems } from "../editor/languageCommandItems";
import { useRoom } from "../editor/roomProvider";
import { CopyRoomUrlCommand } from "./commands/copyRoomUrl";
import { ArchiveRoomCommand } from "./commands/roomArchive";
import { EditRoomLanguageRootCommand } from "./commands/roomLanguage";
import { EditRoomTitleRootCommand } from "./commands/roomTitle";

type CommandMenuPage = "root" | "language" | "rooms";

interface CommandMenuProps {
  onEditTitle: () => void;
  switchRoomsRequest?: number;
}

export function CommandMenu(props: CommandMenuProps) {
  const room = useRoom();
  const navigate = useNavigate();
  const previousSwitchRoomsRequestRef = useRef(props.switchRoomsRequest);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<CommandMenuPage>("root");
  const selectedLanguage = getLanguage(room.editorLanguage);
  const roomsList = useRooms();
  const switchableRooms = roomsList.rooms.filter((listedRoom) => listedRoom.isArchived === false);

  const getRoomCommandValue = (listedRoom: RoomSummary) => {
    const title = listedRoom.title.trim().length > 0 ? listedRoom.title : "Untitled room";
    return `${title} ${listedRoom.shareToken}`;
  };

  const roomsDefaultValue = page === "rooms" && switchableRooms.length > 0 ? getRoomCommandValue(switchableRooms[0]) : undefined;

  const liveUrl = `${window.location.origin}/rooms/${room.shareToken}`;
  const staticUrl = room.staticToken !== null ? `${window.location.origin}/s/${room.staticToken}` : null;

  const closeMenu = () => {
    setOpen(false);
    setPage("root");
  };

  const editTitle = () => {
    closeMenu();
    window.requestAnimationFrame(() => {
      props.onEditTitle();
    });
  };

  const selectLanguage = (language: Language) => {
    void room.updateEditorLanguage(language.value);
    closeMenu();
  };

  const switchRoom = (shareToken: string) => {
    closeMenu();
    void navigate({ to: "/rooms/$shareToken", params: { shareToken } });
  };

  const archiveRoom = async () => {
    await room.archiveRoom();
    toasts.rooms.archived();
    await navigate({ to: "/dashboard" });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModK = (event.metaKey === true || event.ctrlKey === true) && event.key.toLowerCase() === "k";

      if (isModK === false) {
        return;
      }

      event.preventDefault();
      setOpen((currentOpen) => currentOpen === false);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (props.switchRoomsRequest === undefined || props.switchRoomsRequest === previousSwitchRoomsRequestRef.current) {
      return;
    }

    previousSwitchRoomsRequestRef.current = props.switchRoomsRequest;
    setPage("rooms");
    setOpen(true);
  }, [props.switchRoomsRequest]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen === true) {
          setOpen(true);
          return;
        }

        closeMenu();
      }}
      title="Editor command menu"
      description="Search room commands."
      className="top-14 sm:max-w-126"
    >
      <Command key={page} loop defaultValue={roomsDefaultValue}>
        <CommandInput
          autoFocus
          placeholder={page === "language" ? "Select a language..." : page === "rooms" ? "Switch rooms..." : "Execute a command..."}
        />
        <CommandList>
          <CommandEmpty>No command found.</CommandEmpty>
          {page === "root" ? (
            <CommandGroup>
              <CommandItem value="Switch room" keywords={["room", "rooms", "switch", "open"]} onSelect={() => setPage("rooms")}>
                <span>Switch room</span>
              </CommandItem>
              <CopyRoomUrlCommand
                label="Copy room link"
                url={liveUrl}
                toastTitle="Room link copied to your clipboard - share it!"
                onComplete={closeMenu}
              />
              {staticUrl !== null ? (
                <CopyRoomUrlCommand
                  label="Copy static room link"
                  url={staticUrl}
                  toastTitle="Static room link copied to your clipboard - share it!"
                  onComplete={closeMenu}
                />
              ) : null}
              {room.canEdit === true ? <EditRoomTitleRootCommand onSelect={editTitle} /> : null}
              {room.canEdit === true ? <EditRoomLanguageRootCommand onSelect={() => setPage("language")} /> : null}
              {room.isCreator === true ? <ArchiveRoomCommand onArchive={archiveRoom} onComplete={closeMenu} /> : null}
            </CommandGroup>
          ) : page === "language" ? (
            <CommandGroup>
              <LanguageCommandItems currentValue={selectedLanguage.value} onSelect={selectLanguage} />
            </CommandGroup>
          ) : (
            <CommandGroup>
              <CommandItem className="text-xs text-muted-foreground data-selected:bg-transparent data-selected:text-foreground" value="Back to commands" keywords={["back", "commands"]} onSelect={() => setPage("root")}>
                <span>Back to commands</span>
              </CommandItem>
              {roomsList.isLoading === true ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading rooms.</div>
              ) : switchableRooms.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No rooms available.</div>
              ) : switchableRooms.map((listedRoom) => {
                const title = listedRoom.title.trim().length > 0 ? listedRoom.title : "Untitled room";
                const isCurrentRoom = listedRoom.shareToken === room.shareToken;

                return (
                  <CommandItem
                    key={listedRoom.id}
                    className="min-w-0"
                    value={getRoomCommandValue(listedRoom)}
                    keywords={["room", "switch", title]}
                    onSelect={() => switchRoom(listedRoom.shareToken)}
                  >
                    <span className="min-w-0 flex-1 truncate">{title}</span>
                    {isCurrentRoom === true ? <span className="ml-auto shrink-0 text-muted-foreground">current</span> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
