import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@rcode/ui/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRoom } from "../editor/roomProvider";
import { CopyRoomUrlCommand } from "./commands/copyRoomUrl";
import { ArchiveRoomCommand } from "./commands/roomArchive";
import { EditRoomTitleRootCommand } from "./commands/roomTitle";

interface CommandMenuProps {
  onEditTitle: () => void;
}

export function CommandMenu(props: CommandMenuProps) {
  const room = useRoom();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const liveUrl = `${window.location.origin}/rooms/${room.shareToken}`;
  const staticUrl = room.staticToken !== null ? `${window.location.origin}/s/${room.staticToken}` : null;

  const closeMenu = () => {
    setOpen(false);
  };

  const editTitle = () => {
    closeMenu();
    window.requestAnimationFrame(() => {
      props.onEditTitle();
    });
  };

  const archiveRoom = async () => {
    await room.archiveRoom();
    toast("Room archived", {
      description: "The room is now available from the Archived section.",
    });
    await navigate({ to: "/dashboard" });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey === true && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((currentOpen) => currentOpen === false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

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
      className="top-24 w-[calc(100vw-2rem)] sm:max-w-[34rem] !rounded-sm translate-y-0 border-border/70 bg-popover/95 shadow-2xl backdrop-blur"
    >
      <Command>
        <CommandInput placeholder="Execute a command..." />
        <CommandList className="max-h-80">
          <CommandEmpty>No command found.</CommandEmpty>
          <CommandGroup>
            <CopyRoomUrlCommand
              label="Copy room link..."
              url={liveUrl}
              toastTitle="Room link copied to your clipboard - share it!"
              onComplete={closeMenu}
            />
            {staticUrl !== null ? (
              <CopyRoomUrlCommand
                label="Copy static room link..."
                url={staticUrl}
                toastTitle="Static room link copied to your clipboard - share it!"
                onComplete={closeMenu}
              />
            ) : null}
            {room.canEdit === true ? <EditRoomTitleRootCommand onSelect={editTitle} /> : null}
            {room.isCreator === true ? <ArchiveRoomCommand onArchive={archiveRoom} onComplete={closeMenu} /> : null}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
