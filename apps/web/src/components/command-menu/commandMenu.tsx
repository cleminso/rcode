import { getLanguage, type Language } from "@rcode/icons/languages";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@rcode/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LanguageCommandItems } from "../editor/languageCommandItems";
import { useRoom } from "../editor/roomProvider";
import { CopyRoomUrlCommand } from "./commands/copyRoomUrl";
import { ArchiveRoomCommand } from "./commands/roomArchive";
import { EditRoomLanguageRootCommand } from "./commands/roomLanguage";
import { EditRoomTitleRootCommand } from "./commands/roomTitle";

type CommandMenuPage = "root" | "language";

interface CommandMenuProps {
  onEditTitle: () => void;
}

export function CommandMenu(props: CommandMenuProps) {
  const room = useRoom();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<CommandMenuPage>("root");
  const selectedLanguage = getLanguage(room.editorLanguage);

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

  const archiveRoom = async () => {
    await room.archiveRoom();
    toast("Room archived", {
      description: "The room is now available from the Archived section.",
    });
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
      <Command key={page} loop>
        <CommandInput autoFocus placeholder={page === "language" ? "Select a language..." : "Execute a command..."} />
        <CommandList>
          <CommandEmpty>No command found.</CommandEmpty>
          {page === "root" ? (
            <CommandGroup>
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
          ) : (
            <CommandGroup>
              <LanguageCommandItems currentValue={selectedLanguage.value} onSelect={selectLanguage} />
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
