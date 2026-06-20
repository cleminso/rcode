import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";

type RoomLookupInput =
  | {
      tokenType: "share";
      token: string;
    }
  | {
      tokenType: "static";
      token: string;
    };

export function useRoomLookup(input: RoomLookupInput) {
  const query = input.tokenType === "share"
    ? app.rooms.where({ shareToken: input.token }).limit(1)
    : app.rooms.where({ staticToken: input.token }).limit(1);
  // Local reads keep cached rooms instant, while edge reads make empty results
  // authoritative enough to show not-found without flashing from local cache misses
  const localRooms = useAll(query);
  const edgeRooms = useAll(query, { tier: "edge" });
  const room = localRooms?.[0] ?? edgeRooms?.[0] ?? null;

  return {
    room,
    isLoading: room === null && edgeRooms === undefined,
    isResolvedEmpty: edgeRooms !== undefined && room === null,
  };
}
