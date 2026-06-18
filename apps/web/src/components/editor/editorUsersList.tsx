import { AvatarGroup, AvatarGroupCount } from "@rcode/ui/avatar";
import { ProfileIdentityAvatar } from "../account/profileIdentityAvatar";
import type { RoomPresence } from "../../hooks/useRoomPresence";

interface EditorUsersListProps {
  maxUsers?: number;
  presence: RoomPresence;
}

export function EditorUsersList(props: EditorUsersListProps) {
  const { maxUsers = 4, presence } = props;

  const sortedUsers = presence.users.toSorted((a, b) => {
    if (a.isLocal === true) {
      return -1;
    }

    if (b.isLocal === true) {
      return 1;
    }

    return a.sessionUserId.localeCompare(b.sessionUserId);
  });

  const displayedUsers = sortedUsers.slice(0, maxUsers);
  const remainingCount = sortedUsers.length - displayedUsers.length;

  return (
    <div
      className="flex items-center select-none"
      aria-label={`${sortedUsers.length} active user${sortedUsers.length === 1 ? "" : "s"}`}
      title={sortedUsers.map((user) => {
        return `${user.displayName}${user.isLocal === true ? " (you)" : ""}`;
      }).join(", ")}
    >
      <AvatarGroup className="-space-x-1 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
        {displayedUsers.map((user) => (
          <ProfileIdentityAvatar
            key={user.sessionUserId}
            fallbackDisplayName={user.displayName}
            imageUrl={user.picture}
            sessionUserId={user.sessionUserId}
            size="sm"
          />
        ))}
        {remainingCount > 0 ? (
          <AvatarGroupCount className="rounded-xs bg-muted text-[10px] text-muted-foreground">
            <span>+{remainingCount}</span>
          </AvatarGroupCount>
        ) : null}
      </AvatarGroup>
    </div>
  );
}
