import { CommandItem } from "@rcode/ui/command";

const EDIT_ROOM_LANGUAGE_KEYWORDS = ["language", "syntax", "editor"];

interface EditRoomLanguageRootCommandProps {
  onSelect: () => void;
}

export function EditRoomLanguageRootCommand(props: EditRoomLanguageRootCommandProps) {
  return (
    <CommandItem value="Edit room language" keywords={EDIT_ROOM_LANGUAGE_KEYWORDS} onSelect={props.onSelect}>
      <span>Edit room language</span>
    </CommandItem>
  );
}
