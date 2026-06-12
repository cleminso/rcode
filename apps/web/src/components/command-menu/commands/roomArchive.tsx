import { CommandItem } from "@rcode/ui/ui/command";

const ARCHIVE_ROOM_KEYWORDS = ["delete", "remove"];

interface ArchiveRoomCommandProps {
  onArchive: () => Promise<void>;
  onComplete: () => void;
}

export function ArchiveRoomCommand(props: ArchiveRoomCommandProps) {
  const handleSelect = async () => {
    await props.onArchive();
    props.onComplete();
  };

  return (
    <CommandItem value="Archive room" keywords={ARCHIVE_ROOM_KEYWORDS} onSelect={() => void handleSelect()}>
      <span>Archive room</span>
    </CommandItem>
  );
}
