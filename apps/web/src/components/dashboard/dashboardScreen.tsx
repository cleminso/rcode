import { app } from "@rcode/schema";
import Button from "@rcode/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/ui/avatar";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useAll, useSession } from "jazz-tools/react";
import { RoomList } from "./roomList";
import { useCreateRoom } from "./useCreateRoom";
import { authClient } from "../../lib/auth-client";

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => part !== "");
  const firstInitial = parts[0]?.[0] ?? "R";
  const secondInitial = parts[1]?.[0] ?? "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function LogoButton() {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="icon-lg" onClick={() => navigate({ to: "/" })}>
      <div className="h-4 w-4 rounded-xs bg-primary" />
    </Button>
  );
}

export function DashboardScreen() {
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
  );
  const profile = profileRows?.[0] ?? null;
  const isLoadingProfile = sessionUserId !== null && profileRows === undefined;
  const { canCreate, createRoom, error, isCreating } = useCreateRoom();

  const { data: authSession } = authClient.useSession();
  const displayName = profile?.displayName ?? authSession?.user.name ?? "Profile";

  if (isLoadingProfile === true) {
    return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading profile...</main>;
  }

  if (profile?.displayName.trim() === "" || profile === null) {
    return <Navigate replace to="/" />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <LogoButton />
            <Button variant="primary">
              <span>[D]</span>
              <span>DASHBOARD</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={canCreate === false || isCreating === true}
              onClick={() => void createRoom()}
            >
              <span>[C]</span>
              <span>{isCreating === true ? "CREATING" : "CREATE ROOM"}</span>
            </Button>
            <div className="flex items-center gap-1">
              <Avatar size="sm" className="rounded-xs">
                <AvatarImage src={profile?.avatar ?? authSession?.user.image ?? undefined} alt={displayName} className="rounded-xs" />
                <AvatarFallback className="rounded-xs text-[10px]">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
      </div>
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <section className="flex h-[calc(100vh-3rem)] flex-col gap-4 py-6">
          {error !== null ? <p className="rounded-xs bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          <RoomList />
        </section>
      </div>
    </main>
  );
}
