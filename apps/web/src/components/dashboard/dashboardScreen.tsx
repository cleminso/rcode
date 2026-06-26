import Button, { buttonVariants } from "@rcode/ui/button";
import { Link, Navigate } from "@tanstack/react-router";
import { useSession } from "jazz-tools/react";
import { useNavigationHotkeys } from "../../hooks/useNavigationHotkeys";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { RoomList } from "./roomList";
import { useCreateRoom } from "../../hooks/useCreateRoom";
import { LogoButton } from "../layout/logoButton";

export function DashboardScreen() {
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId);
  const { canCreate, createRoom, error, isCreating } = useCreateRoom();

  useNavigationHotkeys({
    account: true,
    createRoom: {
      enabled: canCreate === true && isCreating === false,
      onCreate: () => void createRoom(),
    },
    dashboard: true,
  });

  if (profileIdentity.isLoading === true) {
    return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading profile...</main>;
  }

  if (profileIdentity.displayName === null || profileIdentity.displayName.trim() === "") {
    return <Navigate replace to="/" />;
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="w-full shrink-0 px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
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
            <Link to="/account" className={buttonVariants({ variant: "default" })}>
              <span>[A]</span>
              <span>ACCOUNT</span>
            </Link>
          </div>
        </header>
      </div>
      <div className="min-h-0 w-full flex-1 px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <section className="flex h-full min-h-0 flex-col gap-4 py-6">
          {error !== null ? <p className="rounded-xs bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          <RoomList />
        </section>
      </div>
    </main>
  );
}
