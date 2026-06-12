import { CommandItem } from "@rcode/ui/ui/command";

const EDIT_ROOM_TITLE_KEYWORDS = ["rename", "title"];

interface EditRoomTitleRootCommandProps {
  onSelect: () => void;
}

export function EditRoomTitleRootCommand(props: EditRoomTitleRootCommandProps) {
  return (
    <CommandItem value="Edit room title" keywords={EDIT_ROOM_TITLE_KEYWORDS} onSelect={props.onSelect}>
      <span>Edit room title</span>
    </CommandItem>
  );
}
