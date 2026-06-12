import { languages } from "@rcode/icons/languages";
import { Button } from "@rcode/ui/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { memo } from "react";

export interface DashboardRoomListItemRoom {
  id: string;
  shareToken: string;
  title: string;
  editorLanguage: string;
  isArchived: boolean;
  canUnarchive: boolean;
}

interface RoomListItemProps {
  room: DashboardRoomListItemRoom;
  onUnarchive: (roomId: string) => void;
}

const languageByValue = new Map<string, (typeof languages)[number]>(
  languages.map((entry) => [entry.value, entry]),
);

export const RoomListItem = memo(function RoomListItem(props: RoomListItemProps) {
  const navigate = useNavigate();
  const language = languageByValue.get(props.room.editorLanguage);
  const LanguageLogo = language?.logo;
  const title = props.room.title.trim().length > 0 ? props.room.title : "Untitled room";

  const handleClick = () => {
    void navigate({ to: "/rooms/$shareToken", params: { shareToken: props.room.shareToken } });
  };

  return (
    <div className="group/item flex h-12 w-full items-center gap-2 rounded-md hover:bg-muted focus-within:border-ring">
      <Button
        type="button"
        variant="ghost"
        className="h-full min-w-0 flex-1 justify-start rounded-md px-4 text-left hover:bg-transparent"
        onClick={handleClick}
      >
        <span className="flex min-w-0 items-center gap-4">
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground" title={language?.name ?? "Plain text"}>
            {LanguageLogo !== undefined ? <LanguageLogo className="size-5" /> : null}
          </span>
          <span className="truncate text-sm font-medium tracking-[-0.01575em] text-foreground">{title}</span>
        </span>
      </Button>

      {props.room.isArchived === true && props.room.canUnarchive === true ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mr-2 shrink-0"
          onClick={() => props.onUnarchive(props.room.id)}
        >
          <span>Unarchive</span>
        </Button>
      ) : null}
    </div>
  );
});
