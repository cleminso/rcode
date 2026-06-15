import { app } from "@rcode/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/ui/avatar";
import { buttonVariants } from "@rcode/ui/ui/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAll, useSession } from "jazz-tools/react";
import { authClient } from "../lib/auth-client";

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => part !== "");
  const firstInitial = parts[0]?.[0] ?? "R";
  const secondInitial = parts[1]?.[0] ?? "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

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
  const displayName = profile?.displayName ?? authSession?.user.name ?? "Profile";
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
      <header className="flex items-center justify-between border-b px-6 py-4">
        <p className="text-sm font-semibold">rcode</p>
        {isProfileComplete === true ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Avatar size="sm">
                <AvatarImage src={profile?.avatar ?? authSession?.user.image ?? undefined} alt={displayName} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <span>{displayName}</span>
            </div>
            <Link className={buttonVariants({ variant: "ghost" })} to="/dashboard">
              Dashboard
            </Link>
            {isSignedInWithEmail === true ? (
              <button
                className={buttonVariants({ variant: "outline" })}
                type="button"
                onClick={() => void handleSignOut()}
              >
                Sign out
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link className={buttonVariants({ variant: "ghost" })} to="/sign-in">
              Sign in
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} to="/sign-up">
              Sign up
            </Link>
          </div>
        )}
      </header>
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight">rcode</h1>
        <p className="mt-4 text-lg text-muted-foreground">Real-time collaborative code rooms.</p>
      </section>
    </main>
  );
}
