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
  isSelected: boolean;
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
      aria-current={props.isSelected === true ? "true" : undefined}
      className="grid w-full min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_112px_104px_62px] items-center justify-items-start gap-3 overflow-hidden rounded-none px-0 text-xs font-medium whitespace-nowrap text-foreground transition-colors outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 aria-current:bg-muted"
      style={{ height: roomListItemHeight }}
    >
      <span className="flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-xs" title={language?.name ?? "Plain text"}>
          {LanguageLogo !== undefined ? <LanguageLogo className="size-5 rounded-xs" /> : null}
        </span>
        <span className="block min-w-0 flex-1 truncate text-left font-sans text-base font-normal text-foreground">
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
