import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";

type RoomLookupInput =
  | {
      tokenType: "share";
      token: string;
      enabled?: boolean;
    }
  | {
      tokenType: "static";
      token: string;
      enabled?: boolean;
    };

export function useRoomLookup(input: RoomLookupInput) {
  const isEnabled = input.enabled ?? true;
  const query = isEnabled === true
    ? input.tokenType === "share"
      ? app.rooms.where({ shareToken: input.token }).limit(1)
      : app.rooms.where({ staticToken: input.token }).limit(1)
    : undefined;
  // Local reads keep cached rooms instant, while edge reads make empty results
  // authoritative enough to show not-found without flashing from local cache misses
  const localResult = useAll(query, { tier: "local-first" });
  const remoteResult = useAll(query, { tier: "remote" });
  const room = localResult.data?.[0] ?? remoteResult.data?.[0] ?? null;
  const error = localResult.error ?? remoteResult.error;

  if (error !== null) {
    throw error;
  }

  return {
    room,
    isLoading: isEnabled === true && room === null && remoteResult.isLoading === true,
    isResolvedEmpty: isEnabled === true && remoteResult.isLoading === false && room === null,
  };
}
