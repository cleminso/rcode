import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type { AwarenessState, AwarenessUser } from "../hooks/useRoomAwareness";

export interface AwarenessEntry {
  clientId: number;
  user: AwarenessUser;
}

function getAwarenessUsers(awareness: Awareness): AwarenessEntry[] {
  const entries: AwarenessEntry[] = [];

  for (const [clientId, state] of awareness.getStates()) {
    const typedState = state as AwarenessState;

    if (typedState.user === undefined) {
      continue;
    }

    entries.push({ clientId, user: typedState.user });
  }

  return entries;
}

function areAwarenessUsersEqual(currentUsers: AwarenessEntry[], nextUsers: AwarenessEntry[]) {
  if (currentUsers.length !== nextUsers.length) {
    return false;
  }

  for (let index = 0; index < currentUsers.length; index += 1) {
    const current = currentUsers[index];
    const next = nextUsers[index];

    if (current === undefined || next === undefined) {
      return false;
    }

    if (
      current.clientId !== next.clientId ||
      current.user.clientId !== next.user.clientId ||
      current.user.color !== next.user.color ||
      current.user.displayName !== next.user.displayName ||
      current.user.picture !== next.user.picture ||
      current.user.sessionUserId !== next.user.sessionUserId
    ) {
      return false;
    }
  }

  return true;
}

export function useAwarenessUsers(awareness: Awareness) {
  const [users, setUsers] = useState<AwarenessEntry[]>(() => getAwarenessUsers(awareness));

  useEffect(() => {
    const handleChange = () => {
      const nextUsers = getAwarenessUsers(awareness);

      setUsers((currentUsers) =>
        areAwarenessUsersEqual(currentUsers, nextUsers) === true ? currentUsers : nextUsers,
      );
    };

    handleChange();
    awareness.on("change", handleChange);

    return () => {
      awareness.off("change", handleChange);
    };
  }, [awareness]);

  return users;
}
