import { app } from "@rcode/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/avatar";
import { useDb } from "jazz-tools/react";
import { useEffect, useState } from "react";
import { getAvatarColor, getInitials } from "./accountUtils";

interface ProfileAvatarProps {
  avatarFileId?: string | null;
  badge?: React.ReactNode;
  className?: string;
  displayName: string;
  imageClassName?: string;
  imageUrl?: string | null;
  loadTier?: "local-first" | "remote";
  size?: "default" | "sm" | "lg";
  title?: string;
}

const avatarBlobCache = new Map<string, Blob>();
const avatarBlobLoadCache = new Map<string, Promise<Blob>>();
const maxCachedAvatarBlobs = 100;

function getAvatarBlobLoadCacheKey(avatarFileId: string, loadTier: "local-first" | "remote") {
  return `${loadTier}:${avatarFileId}`;
}

function cacheAvatarBlob(avatarFileId: string, blob: Blob) {
  avatarBlobCache.delete(avatarFileId);
  avatarBlobCache.set(avatarFileId, blob);

  if (avatarBlobCache.size > maxCachedAvatarBlobs) {
    const oldestAvatarFileId = avatarBlobCache.keys().next().value;

    if (oldestAvatarFileId !== undefined) {
      avatarBlobCache.delete(oldestAvatarFileId);
    }
  }
}

function loadAvatarBlob(db: ReturnType<typeof useDb>, avatarFileId: string, loadTier: "local-first" | "remote") {
  const cachedBlob = avatarBlobCache.get(avatarFileId);

  if (cachedBlob !== undefined) {
    cacheAvatarBlob(avatarFileId, cachedBlob);
    return Promise.resolve(cachedBlob);
  }

  const cacheKey = getAvatarBlobLoadCacheKey(avatarFileId, loadTier);
  const cachedPromise = avatarBlobLoadCache.get(cacheKey);

  if (cachedPromise !== undefined) {
    return cachedPromise;
  }

  const loadPromise = db
    .all(app.files.where({ id: avatarFileId }).limit(1), { tier: loadTier })
    .then((rows) => {
      const file = rows[0];

      if (file === undefined) {
        throw new Error("Avatar file not found.");
      }

      const blob = new Blob([new Uint8Array(file.data)], { type: file.mimeType });
      cacheAvatarBlob(avatarFileId, blob);
      return blob;
    })
    .finally(() => {
      avatarBlobLoadCache.delete(cacheKey);
    });

  avatarBlobLoadCache.set(cacheKey, loadPromise);

  return loadPromise;
}

export function ProfileAvatar({ avatarFileId, badge, className, displayName, imageClassName, imageUrl, loadTier = "local-first", size = "sm", title }: ProfileAvatarProps) {
  const db = useDb();
  const [objectUrlState, setObjectUrlState] = useState<{ avatarFileId: string; url: string } | null>(null);

  useEffect(() => {
    if (imageUrl !== undefined && imageUrl !== null) {
      setObjectUrlState(null);
      return;
    }

    if (avatarFileId === undefined || avatarFileId === null) {
      setObjectUrlState(null);
      return;
    }

    let isCurrent = true;
    let createdObjectUrl: string | null = null;

    void loadAvatarBlob(db, avatarFileId, loadTier)
      .then((blob) => {
        if (isCurrent === true) {
          createdObjectUrl = URL.createObjectURL(blob);
          setObjectUrlState({ avatarFileId, url: createdObjectUrl });
        }
      })
      .catch(() => {
        if (isCurrent === true) {
          setObjectUrlState(null);
        }
      });

    return () => {
      isCurrent = false;

      if (createdObjectUrl !== null) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [avatarFileId, db, imageUrl, loadTier]);

  const objectUrl =
    objectUrlState !== null && objectUrlState.avatarFileId === avatarFileId
      ? objectUrlState.url
      : null;

  return (
    <Avatar className={className} size={size} title={title}>
      <AvatarImage className={imageClassName} src={imageUrl ?? objectUrl ?? undefined} alt={displayName} />
      <AvatarFallback className={imageClassName} style={{ backgroundColor: getAvatarColor(displayName), color: "black" }}>
        {getInitials(displayName)}
      </AvatarFallback>
      {badge}
    </Avatar>
  );
}
