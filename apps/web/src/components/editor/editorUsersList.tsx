import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@rcode/ui/ui/avatar";
import type { Awareness } from "y-protocols/awareness";
import { colors } from "../../lib/awareness";
import { useAwarenessUsers } from "../../hooks/useAwarenessUsers";
import type { AwarenessUser } from "../../hooks/useRoomAwareness";

interface EditorUsersListProps {
  awareness: Awareness;
  maxUsers?: number;
}

function getInitials(displayName: string) {
  return displayName
    .split("-")
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function UserAvatarItem({ user }: { user: AwarenessUser }) {
  const color = colors[user.color];

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
  const { awareness, maxUsers = 4 } = props;
  const users = useAwarenessUsers(awareness);
  const localClientId = awareness.clientID;

  const sortedUsers = users.toSorted((a, b) => {
    if (a.clientId === localClientId) {
      return -1;
    }

    if (b.clientId === localClientId) {
      return 1;
    }

    return a.clientId - b.clientId;
  });

  const displayedUsers = sortedUsers.slice(0, maxUsers);
  const remainingCount = sortedUsers.length - displayedUsers.length;

  return (
    <div
      className="flex items-center select-none"
      aria-label={`${sortedUsers.length} active user${sortedUsers.length === 1 ? "" : "s"}`}
      title={sortedUsers.map((entry) => {
        const isLocal = entry.clientId === localClientId;
        return `${entry.user.displayName}${isLocal ? " (you)" : ""}`;
      }).join(", ")}
    >
      <AvatarGroup>
        {displayedUsers.map((entry) => (
          <UserAvatarItem key={entry.clientId} user={entry.user} />
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
