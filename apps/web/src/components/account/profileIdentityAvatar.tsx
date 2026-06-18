import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { ProfileAvatar } from "./profileAvatar";

interface ProfileIdentityAvatarProps {
  className?: string;
  fallbackDisplayName?: string | null;
  imageClassName?: string;
  imageUrl?: string | null;
  loadTier?: "local" | "edge";
  sessionUserId: string | null;
  size?: "default" | "sm" | "lg";
  tier?: "local" | "edge";
}

export function ProfileIdentityAvatar(props: ProfileIdentityAvatarProps) {
  const identity = useProfileIdentity(props.sessionUserId, props.tier !== undefined ? { tier: props.tier } : undefined);
  const displayName = identity.displayName ?? props.fallbackDisplayName ?? null;

  if (identity.isLoading === true) {
    return <span className={props.className ?? "block size-5 animate-pulse rounded-xs bg-muted"} />;
  }

  if (displayName === null) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <ProfileAvatar
      avatarFileId={identity.avatarFileId}
      className={props.className}
      displayName={displayName}
      imageClassName={props.imageClassName}
      imageUrl={props.imageUrl}
      loadTier={props.loadTier}
      size={props.size}
      title={displayName}
    />
  );
}
