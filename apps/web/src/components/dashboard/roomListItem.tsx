import { languages } from "@rcode/icons/languages";
import { FormattedDate } from "@rcode/ui/formattedDate";
import { Link } from "@tanstack/react-router";
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
  const language = languageByValue.get(props.room.editorLanguage);
  const LanguageLogo = language?.logo;
  const title = props.room.title.trim().length > 0 ? props.room.title : "Untitled room";

  return (
    <Link
      to="/rooms/$shareToken"
      params={{ shareToken: props.room.shareToken }}
      className="grid w-full shrink-0 grid-cols-[minmax(0,1fr)_120px_128px_80px] items-center justify-items-start gap-3 rounded-none px-0 text-xs font-medium whitespace-nowrap text-foreground transition-colors outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
      style={{ height: roomListItemHeight }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-xs" title={language?.name ?? "Plain text"}>
          {LanguageLogo !== undefined ? <LanguageLogo className="size-5 rounded-xs" /> : null}
        </span>
        <span className="overflow-hidden text-left font-sans font-normal  text-base text-foreground">
          {title}
        </span>
      </span>
      <span className="justify-self-start text-right">
        <FormattedDate date={props.lastAccessedAt} variant="default" className="text-xs" />
      </span>
      <span className="flex justify-self-start items-center gap-1">
        <RoomParticipantsCell creatorSessionUserId={props.room.creatorSessionUserId} participants={props.participants} />
      </span>
      <span className="flex justify-self-start items-center gap-1">
        <ProfileIdentityAvatar sessionUserId={props.room.creatorSessionUserId} size="sm" />
      </span>
    </Link>
  );
});
