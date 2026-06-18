import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";
import { useMemo } from "react";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import * as Y from "yjs";
import { toYjsUpdate } from "../../lib/yjsUpdate";
import { StaticRoomContent } from "./content";

interface StaticRoomScreenProps {
  staticToken: string;
}

interface StaticRoomYjsSnapshot {
  createdAt: Date;
  state: unknown;
}

interface StaticRoomYjsUpdate {
  createdAt: Date;
  update: unknown;
}

const MONACO_TEXT_NAME = "monaco";

function EmptyState(props: { title: string; description: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="max-w-sm rounded-xl border bg-background p-6 text-center shadow-sm">
        <h1 className="text-sm font-semibold tracking-[-0.01575em]">{props.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{props.description}</p>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">Loading static room.</p>
    </main>
  );
}

function extractStaticRoomCode(snapshots: readonly StaticRoomYjsSnapshot[], updates: readonly StaticRoomYjsUpdate[]) {
  const doc = new Y.Doc();

  try {
    const latestSnapshot = snapshots.reduce<(typeof snapshots)[number] | null>((latest, snapshot) => {
      if (latest === null) {
        return snapshot;
      }

      return snapshot.createdAt > latest.createdAt ? snapshot : latest;
    }, null);

    if (latestSnapshot !== null) {
      Y.applyUpdate(doc, toYjsUpdate(latestSnapshot.state));
    }

    // TODO: Apply only updates after the latest snapshot if snapshot timestamps are guaranteed to cover prior updates.
    for (const updateRow of updates.toSorted((left, right) => left.createdAt.getTime() - right.createdAt.getTime())) {
      Y.applyUpdate(doc, toYjsUpdate(updateRow.update));
    }

    const monacoText = doc.getText(MONACO_TEXT_NAME).toJSON();

    return typeof monacoText === "string" ? monacoText : String(monacoText);
  } finally {
    doc.destroy();
  }
}

export function StaticRoomScreen(props: StaticRoomScreenProps) {
  const rooms = useAll(app.rooms.where({ staticToken: props.staticToken }).limit(1));
  const room = rooms?.[0] ?? null;
  const isArchived = room?.archivedAt !== undefined && room.archivedAt !== null;
  const activeRoomId = room !== null && isArchived === false ? room.id : null;
  const metadataRows = useAll(activeRoomId !== null ? app.roomMetadata.where({ room_id: activeRoomId }).limit(1) : undefined);
  const metadata = metadataRows?.[0] ?? null;
  const creator = useProfileIdentity(room !== null && isArchived === false ? room.creator_session_user_id : null, { tier: "edge" });
  const snapshotRows = useAll(activeRoomId !== null ? app.roomYjsSnapshots.where({ room_id: activeRoomId }) : undefined);
  const updateRows = useAll(activeRoomId !== null ? app.roomYjsUpdates.where({ room_id: activeRoomId }) : undefined);
  const codeResult = useMemo(() => {
    if (snapshotRows === undefined || updateRows === undefined) {
      return { status: "loading" } as const;
    }

    try {
      return { status: "ready", code: extractStaticRoomCode(snapshotRows, updateRows) } as const;
    } catch (error) {
      console.error("Failed to extract static room code.", error);
      return { status: "error" } as const;
    }
  }, [snapshotRows, updateRows]);

  if (rooms === undefined) {
    return <LoadingState />;
  }

  if (room === null) {
    return <EmptyState title="Room not found" description="The static room link does not match an accessible room." />;
  }

  if (isArchived === true) {
    return <EmptyState title="This room has been archived" description="The static room link is not accessible anymore." />;
  }

  if (metadataRows === undefined || creator.isLoading === true || codeResult.status === "loading") {
    return <LoadingState />;
  }

  if (codeResult.status === "error") {
    return <EmptyState title="Static room could not be loaded" description="The room code could not be reconstructed." />;
  }

  return (
    <StaticRoomContent
      code={codeResult.code}
      creator={{
        avatarFileId: creator.avatarFileId,
        displayName: creator.displayName ?? "Unknown creator",
      }}
      editorLanguage={metadata?.editorLanguage ?? "plaintext"}
      title={metadata?.title ?? ""}
    />
  );
}
