import { languages } from "@rcode/icons/languages";
import { Button } from "@rcode/ui/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { memo } from "react";

export interface DashboardRoomListItemRoom {
  id: string;
  shareToken: string;
  title: string;
  editorLanguage: string;
}

interface RoomListItemProps {
  room: DashboardRoomListItemRoom;
}

const languageByValue = new Map(languages.map((entry) => [entry.value, entry]));

export const RoomListItem = memo(function RoomListItem(props: RoomListItemProps) {
  const navigate = useNavigate();
  const language = languageByValue.get(props.room.editorLanguage);
  const LanguageLogo = language?.logo;
  const title = props.room.title.trim().length > 0 ? props.room.title : "Untitled room";

  const handleClick = () => {
    void navigate({ to: "/rooms/$shareToken", params: { shareToken: props.room.shareToken } });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className="group/item h-12 w-full justify-between rounded-md px-4 text-left hover:bg-muted focus-visible:border-ring"
      onClick={handleClick}
    >
      <span className="flex min-w-0 items-center gap-4">
        <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground" title={language?.name ?? "Plain text"}>
          {LanguageLogo !== undefined ? <LanguageLogo className="size-5" /> : null}
        </span>
        <span className="truncate text-sm font-medium tracking-[-0.01575em] text-foreground">{title}</span>
      </span>

      <span className="shrink-0" />
    </Button>
  );
});
