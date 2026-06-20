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
  const localRooms = useAll(query);
  const edgeRooms = useAll(query, { tier: "edge" });
  const room = localRooms?.[0] ?? edgeRooms?.[0] ?? null;

  return {
    room,
    isLoading: isEnabled === true && room === null && edgeRooms === undefined,
    isResolvedEmpty: isEnabled === true && edgeRooms !== undefined && room === null,
  };
}
