import Button from "@rcode/ui/button";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useSession } from "jazz-tools/react";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { RoomList } from "./roomList";
import { useCreateRoom } from "./useCreateRoom";

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
  const profileIdentity = useProfileIdentity(sessionUserId);
  const { canCreate, createRoom, error, isCreating } = useCreateRoom();
  const navigate = useNavigate();

  if (profileIdentity.isLoading === true) {
    return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading profile...</main>;
  }

  if (profileIdentity.displayName === null || profileIdentity.displayName.trim() === "") {
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
            <Button variant="default" onClick={() => navigate({ to: "/account" })}>
              <span>[A]</span>
              <span>ACCOUNT</span>
            </Button>
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
