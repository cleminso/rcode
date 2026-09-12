import { CommandItem } from "@rcode/ui/command";
import { useMemo } from "react";
import { getErrorMessage } from "../../../lib/errors";
import { toasts } from "../../../lib/toasts";

const COPY_ROOM_URL_KEYWORDS = ["copy", "link"];

interface CopyRoomUrlCommandProps {
  label: string;
  url: string;
  toastTitle: string;
  onComplete: () => void;
}

export function CopyRoomUrlCommand(props: CopyRoomUrlCommandProps) {
  const keywords = useMemo(() => [props.url, ...COPY_ROOM_URL_KEYWORDS], [props.url]);

  const handleSelect = async () => {
    try {
      await navigator.clipboard.writeText(props.url);
      toasts.rooms.linkCopied(props.toastTitle, props.url);
      props.onComplete();
    } catch (error) {
      toasts.rooms.error(getErrorMessage(error, "Room link could not be copied."));
    }
  };

  return (
    <CommandItem value={props.label} keywords={keywords} onSelect={() => void handleSelect()}>
      <span className="truncate">{props.label}</span>
      <span className="ml-4 max-w-auto truncate text-muted-foreground">{props.url}</span>
    </CommandItem>
  );
}
