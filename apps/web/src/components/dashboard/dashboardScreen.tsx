import { app } from "@rcode/schema";
import { Navigate } from "@tanstack/react-router";
import { useAll, useSession } from "jazz-tools/react";
import { AuthButton } from "../auth/authButton";
import { RoomList } from "./roomList";
import { useCreateRoom } from "./useCreateRoom";

export function DashboardScreen() {
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
  );
  const profile = profileRows?.[0] ?? null;
  const isLoadingProfile = sessionUserId !== null && profileRows === undefined;
  const { canCreate, createRoom, error, isCreating } = useCreateRoom();

  if (isLoadingProfile === true) {
    return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading profile...</main>;
  }

  if (profile?.displayName.trim() === "" || profile === null) {
    return <Navigate replace to="/" />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <p className="text-sm font-semibold">rcode</p>
        <AuthButton />
      </header>
      <section className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-6 py-10">
        {error !== null ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        <RoomList canCreate={canCreate} isCreating={isCreating} onCreateRoom={() => void createRoom()} />
      </section>
    </main>
  );
}
