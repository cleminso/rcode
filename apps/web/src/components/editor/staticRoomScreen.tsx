import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";

interface StaticRoomScreenProps {
  staticToken: string;
}

export function StaticRoomScreen(props: StaticRoomScreenProps) {
  const rooms = useAll(app.rooms.where({ staticToken: props.staticToken }).limit(1));
  const room = rooms?.[0] ?? null;

  if (rooms === undefined) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <p className="text-sm text-muted-foreground">Loading static room.</p>
      </main>
    );
  }

  if (room?.archivedAt !== undefined && room.archivedAt !== null) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div className="max-w-sm rounded-xl border bg-background p-6 text-center shadow-sm">
          <h1 className="text-sm font-semibold tracking-[-0.01575em]">This room has been archived</h1>
          <p className="mt-2 text-sm text-muted-foreground">The static room link is not accessible anymore.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">Static room {props.staticToken}</p>
    </main>
  );
}
