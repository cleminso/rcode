import { languages } from "@rcode/icons/languages";
import { FormattedDate } from "@rcode/ui/formattedDate";
import { Link } from "@tanstack/react-router";
import { memo, useEffect, useRef } from "react";
import { usePrefetchRoom } from "../../hooks/usePrefetchRoom";
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
  const { prefetch, cancelPrefetch } = usePrefetchRoom();

  // Counts how many focusing inputs are currently active (hover + focus).
  // Use Ref because this value changes on every mouse movement and never
  // affects rendered output; only props.isSelected drives visual state.
  const activeInputCountRef = useRef(0);

  // Mirrors props.isSelected for use inside event handlers and timeouts. Reading
  // props.isSelected directly would capture a stale closure if the prop changes
  // between render and the timeout firing.
  const isSelectedRef = useRef(props.isSelected === true);

  // Delays cancellation after mouse leave / blur. The cursor might leaves the row
  // a few ms before the click, so keeping the subscription alive briefly lets the data
  // arrive before navigation unmounts the item.
  const deactivateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isSelectedRef.current = props.isSelected === true;

    // Keyboard selection changing must clear any pending
    // mouse-leave cancellation so the selected row stays warm.
    if (deactivateTimeoutRef.current !== null) {
      clearTimeout(deactivateTimeoutRef.current);
      deactivateTimeoutRef.current = null;
    }

    if (props.isSelected === true) {
      prefetch(props.room.id, props.room.shareToken);
    } else if (activeInputCountRef.current === 0) {
      cancelPrefetch(props.room.id);
    }
  }, [props.isSelected, props.room.id, props.room.shareToken, prefetch, cancelPrefetch]);

  useEffect(() => {
    return () => {
      if (deactivateTimeoutRef.current !== null) {
        clearTimeout(deactivateTimeoutRef.current);
      }

      cancelPrefetch(props.room.id);
    };
  }, [cancelPrefetch, props.room.id]);

  const handleActivate = () => {
    activeInputCountRef.current += 1;

    if (deactivateTimeoutRef.current !== null) {
      clearTimeout(deactivateTimeoutRef.current);
      deactivateTimeoutRef.current = null;
    }

    prefetch(props.room.id, props.room.shareToken);
  };

  const handleDeactivate = () => {
    activeInputCountRef.current -= 1;

    if (activeInputCountRef.current === 0 && isSelectedRef.current === false) {
      deactivateTimeoutRef.current = setTimeout(() => {
        deactivateTimeoutRef.current = null;
        cancelPrefetch(props.room.id);
      }, 300);
    }
  };

  return (
    <Link
      to="/rooms/$shareToken"
      params={{ shareToken: props.room.shareToken }}
      aria-current={props.isSelected === true ? "true" : undefined}
      className="grid w-full min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_112px_104px_62px] items-center justify-items-start gap-3 overflow-hidden rounded-none px-0 text-xs font-medium whitespace-nowrap text-foreground transition-colors outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 aria-current:bg-muted"
      style={{ height: roomListItemHeight }}
      onMouseEnter={handleActivate}
      onMouseLeave={handleDeactivate}
      onFocus={handleActivate}
      onBlur={handleDeactivate}
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
