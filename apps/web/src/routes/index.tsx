import { app } from "@rcode/schema";
import Button from "@rcode/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAll, useSession } from "jazz-tools/react";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function LogoButton() {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
      <div className="h-4 w-4 rounded-xs bg-primary" />
    </Button>
  );
}

function IndexRoute() {
  const navigate = useNavigate();
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
  );
  const profile = profileRows?.[0] ?? null;
  const isLoadingProfile = sessionUserId !== null && profileRows === undefined;

  const { data: authSession } = authClient.useSession();
  const isProfileComplete = profile !== null ? profile.displayName.trim() !== "" : false;
  const isSignedInWithEmail = authSession?.user.email !== undefined;

  const handleSignOut = async () => {
    await authClient.signOut();
    await navigate({ to: "/" });
  };

  if (isLoadingProfile === true) {
    return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading profile...</main>;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <header className="flex items-center justify-between py-3">
          <LogoButton />
          {isProfileComplete === true ? (
            <div className="flex items-center gap-2">
              <Button variant="default" onClick={() => navigate({ to: "/dashboard" })}>
                <span>[D]</span>
                <span>DASHBOARD</span>
              </Button>
              <Button variant="default" onClick={() => navigate({ to: "/account" })}>
                <span>[A]</span>
                <span>ACCOUNT</span>
              </Button>
              {isSignedInWithEmail === true ? (
                <Button variant="ghost" onClick={() => void handleSignOut()}>
                  <span>[X]</span>
                  <span>SIGN OUT</span>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="default" onClick={() => navigate({ to: "/sign-in" })}>
                <span>[I]</span>
                <span>SIGN IN</span>
              </Button>
              <Button variant="primary" onClick={() => navigate({ to: "/sign-up" })}>
                <span>[U]</span>
                <span>SIGN UP</span>
              </Button>
            </div>
          )}
        </header>
        <section className="flex flex-col items-center justify-center py-24 text-center">
          <h1 className="text-4xl font-semibold ">rcode</h1>
          <p className="mt-4 text-lg text-muted-foreground">Real-time collaborative code rooms.</p>
        </section>
      </div>
    </main>
  );
}
