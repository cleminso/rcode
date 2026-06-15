import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@rcode/ui/ui/avatar";
import { baseColors, colors, type BaseColor } from "../../lib/awareness";
import type { RoomPresence, RoomPresenceUser } from "../../hooks/useRoomPresence";

interface EditorUsersListProps {
  maxUsers?: number;
  presence: RoomPresence;
}

function getInitials(displayName: string) {
  return displayName
    .split("-")
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

// Deterministic color assignment from sessionUserId. The same user always
// gets the same color across tabs and sessions, replacing the previous
// awareness-based approach where color was picked from the least-used palette
// (which produced different colors per tab for the same user).
function getUserColor(sessionUserId: string): BaseColor {
  let hash = 0;

  for (let index = 0; index < sessionUserId.length; index += 1) {
    hash = (hash + sessionUserId.charCodeAt(index)) % baseColors.length;
  }

  return baseColors[hash]!;
}

function UserAvatarItem({ user }: { user: RoomPresenceUser }) {
  const color = colors[getUserColor(user.sessionUserId)];

  return (
    <Avatar
      size="sm"
      className={color.avatarBg}
      title={user.displayName}
    >
      {user.picture !== undefined ? (
        <AvatarImage src={user.picture} alt={user.displayName} />
      ) : null}
      <AvatarFallback className={`${color.avatarBg} text-white`}>
        {getInitials(user.displayName)}
      </AvatarFallback>
    </Avatar>
  );
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
      <AvatarGroup>
        {displayedUsers.map((user) => (
          <UserAvatarItem key={user.sessionUserId} user={user} />
        ))}
        {remainingCount > 0 ? (
          <AvatarGroupCount>
            <span>+{remainingCount}</span>
          </AvatarGroupCount>
        ) : null}
      </AvatarGroup>
    </div>
  );
}
