import { app } from "@rcode/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/avatar";
import { useDb } from "jazz-tools/react";
import { useEffect, useState } from "react";
import { getAvatarColor, getInitials } from "./accountUtils";

interface ProfileAvatarProps {
  avatarFileId?: string | null;
  className?: string;
  displayName: string;
  imageClassName?: string;
  imageUrl?: string | null;
  loadTier?: "local" | "edge";
  size?: "default" | "sm" | "lg";
  title?: string;
}

const avatarObjectUrlCache = new Map<string, string>();
const avatarBlobLoadCache = new Map<string, Promise<string>>();

function getAvatarBlobLoadCacheKey(avatarFileId: string, loadTier: "local" | "edge") {
  return `${loadTier}:${avatarFileId}`;
}

function loadAvatarObjectUrl(db: ReturnType<typeof useDb>, avatarFileId: string, loadTier: "local" | "edge") {
  const cachedObjectUrl = avatarObjectUrlCache.get(avatarFileId);

  if (cachedObjectUrl !== undefined) {
    return Promise.resolve(cachedObjectUrl);
  }

  const cacheKey = getAvatarBlobLoadCacheKey(avatarFileId, loadTier);
  const cachedPromise = avatarBlobLoadCache.get(cacheKey);

  if (cachedPromise !== undefined) {
    return cachedPromise;
  }

  const loadPromise = db
    .loadFileAsBlob(app, avatarFileId, { tier: loadTier })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);

      avatarObjectUrlCache.set(avatarFileId, objectUrl);
      avatarBlobLoadCache.delete(cacheKey);

      return objectUrl;
    })
    .catch((caughtError: unknown) => {
      avatarBlobLoadCache.delete(cacheKey);
      throw caughtError;
    });

  avatarBlobLoadCache.set(cacheKey, loadPromise);

  return loadPromise;
}

export function ProfileAvatar({ avatarFileId, className, displayName, imageClassName, imageUrl, loadTier = "local", size = "sm", title }: ProfileAvatarProps) {
  const db = useDb();
  const [objectUrl, setObjectUrl] = useState<string | null>(() => {
    if (avatarFileId === undefined || avatarFileId === null) {
      return null;
    }

    return avatarObjectUrlCache.get(avatarFileId) ?? null;
  });

  useEffect(() => {
    if (avatarFileId === undefined || avatarFileId === null) {
      setObjectUrl(null);
      return;
    }

    let isCurrent = true;
    const cachedObjectUrl = avatarObjectUrlCache.get(avatarFileId);

    if (cachedObjectUrl !== undefined) {
      setObjectUrl(cachedObjectUrl);
      return;
    }

    void loadAvatarObjectUrl(db, avatarFileId, loadTier)
      .then((blob) => {
        if (isCurrent === true) {
          setObjectUrl(blob);
        }
      })
      .catch(() => {
        if (isCurrent === true) {
          setObjectUrl(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [avatarFileId, db, loadTier]);

  return (
    <Avatar className={className} size={size} title={title}>
      <AvatarImage className={imageClassName} src={imageUrl ?? objectUrl ?? undefined} alt={displayName} />
      <AvatarFallback className={imageClassName} style={{ backgroundColor: getAvatarColor(displayName), color: "black" }}>
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
