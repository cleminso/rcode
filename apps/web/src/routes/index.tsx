import Button, { buttonVariants } from "@rcode/ui/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "jazz-tools/react";
import { LogoButton } from "../components/layout/logoButton";
import { useNavigationHotkeys } from "../hooks/useNavigationHotkeys";
import { useProfileIdentity } from "../hooks/useProfileIdentity";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  const navigate = useNavigate();
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId);

  const { data: authSession } = authClient.useSession();
  const isProfileComplete = profileIdentity.displayName !== null ? profileIdentity.displayName.trim() !== "" : false;
  const isSignedInWithEmail = authSession?.user.email !== undefined;

  useNavigationHotkeys({
    account: isProfileComplete === true,
    dashboard: isProfileComplete === true,
    signIn: profileIdentity.isLoading === false && isProfileComplete === false,
    signUp: profileIdentity.isLoading === false && isProfileComplete === false,
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    await navigate({ to: "/" });
  };

  if (profileIdentity.isLoading === true) {
    return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading profile...</main>;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <header className="flex items-center justify-between py-3">
            <LogoButton />
          {isProfileComplete === true ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className={buttonVariants({ variant: "default" })}>
                <span>[D]</span>
                <span>DASHBOARD</span>
              </Link>
              <Link to="/account" className={buttonVariants({ variant: "default" })}>
                <span>[A]</span>
                <span>ACCOUNT</span>
              </Link>
              {isSignedInWithEmail === true ? (
                <Button variant="ghost" onClick={() => void handleSignOut()}>
                  <span>[X]</span>
                  <span>SIGN OUT</span>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/sign-in" className={buttonVariants({ variant: "default" })}>
                <span>[I]</span>
                <span>SIGN IN</span>
              </Link>
              <Link to="/sign-up" className={buttonVariants({ variant: "primary" })}>
                <span>[U]</span>
                <span>SIGN UP</span>
              </Link>
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
