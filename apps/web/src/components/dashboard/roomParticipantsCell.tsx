import { AvatarGroup, AvatarGroupCount } from "@rcode/ui/avatar";
import { useMemo } from "react";
import { ProfileIdentityAvatar } from "../account/profileIdentityAvatar";

export interface RoomParticipant {
  avatarFileId?: string | null;
  displayName: string;
  imageUrl?: string | null;
  picture?: string;
  sessionUserId: string;
}

interface RoomParticipantsCellProps {
  creatorSessionUserId: string | null;
  participants: RoomParticipant[];
}

const maxVisibleItems = 4;

function sortParticipants(participants: RoomParticipant[], creatorSessionUserId: string | null) {
  const participantBySessionUserId = new Map<string, RoomParticipant>();

  for (const participant of participants) {
    if (participantBySessionUserId.has(participant.sessionUserId) === false) {
      participantBySessionUserId.set(participant.sessionUserId, participant);
    }
  }

  const uniqueParticipants = Array.from(participantBySessionUserId.values());

  if (creatorSessionUserId === null) {
    return uniqueParticipants;
  }

  return uniqueParticipants.toSorted((left, right) => {
    const leftIsCreator = left.sessionUserId === creatorSessionUserId;
    const rightIsCreator = right.sessionUserId === creatorSessionUserId;

    if (leftIsCreator === rightIsCreator) {
      return 0;
    }

    return leftIsCreator === true ? -1 : 1;
  });
}

export function RoomParticipantsCell(props: RoomParticipantsCellProps) {
  const participants = useMemo(
    () => sortParticipants(props.participants, props.creatorSessionUserId),
    [props.creatorSessionUserId, props.participants],
  );

  if (participants.length === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const hasOverflow = participants.length > maxVisibleItems;
  const visibleAvatarCount = hasOverflow === true ? maxVisibleItems - 1 : maxVisibleItems;
  const visibleParticipants = participants.slice(0, visibleAvatarCount);
  const hiddenParticipantCount = participants.length - visibleParticipants.length;

  return (
    <AvatarGroup className="justify-end" title={participants.map((participant) => participant.displayName).join(", ")}>
      {visibleParticipants.map((participant) => (
        <ProfileIdentityAvatar
          key={participant.sessionUserId}
          fallbackDisplayName={participant.displayName}
          imageUrl={participant.imageUrl ?? participant.picture}
          sessionUserId={participant.sessionUserId}
          size="sm"
        />
      ))}
      {hiddenParticipantCount > 0 ? <AvatarGroupCount>+{hiddenParticipantCount}</AvatarGroupCount> : null}
    </AvatarGroup>
  );
}
