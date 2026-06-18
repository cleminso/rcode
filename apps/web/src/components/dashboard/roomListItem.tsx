import { languages } from "@rcode/icons/languages";
import Button from "@rcode/ui/button";
import { FormattedDate } from "@rcode/ui/formattedDate";
import { useNavigate } from "@tanstack/react-router";
import { memo } from "react";
import { ProfileIdentityAvatar } from "../account/profileIdentityAvatar";
import { RoomParticipantsCell, type RoomParticipant } from "./roomParticipantsCell";

export interface DashboardRoomListItemRoom {
  id: string;
  shareToken: string;
  title: string;
  editorLanguage: string;
  isArchived: boolean;
  canUnarchive: boolean;
  creatorSessionUserId: string;
}

interface RoomListItemProps {
  room: DashboardRoomListItemRoom;
  lastAccessedAt: Date | null;
  participants: RoomParticipant[];
}

export const roomListItemHeight = 36;

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
    <Button
      variant="row"
      size="none"
      className="grid w-full grid-cols-[minmax(0,1fr)_160px_80px_80px] justify-items-start gap-3 px-0"
      style={{ height: roomListItemHeight }}
      onClick={handleClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-xs" title={language?.name ?? "Plain text"}>
          {LanguageLogo !== undefined ? <LanguageLogo className="size-5 rounded-xs" /> : null}
        </span>
        <span className="truncate text-left font-sans font-normal  text-base text-foreground">
          {title}
        </span>
      </span>
      <span className="justify-self-start text-left">
        <FormattedDate date={props.lastAccessedAt} variant="default" className="text-xs" />
      </span>
      <span className="flex justify-self-end items-center gap-1">
        <RoomParticipantsCell creatorSessionUserId={props.room.creatorSessionUserId} participants={props.participants} />
      </span>
      <span className="flex justify-self-end items-center gap-1">
        <ProfileIdentityAvatar sessionUserId={props.room.creatorSessionUserId} size="sm" />
      </span>
    </Button>
  );
});
