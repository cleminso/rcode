import { getLanguage } from "@rcode/icons/languages";
import Button, { buttonVariants } from "@rcode/ui/button";
import { Link } from "@tanstack/react-router";
import { JazzProvider, useSession } from "jazz-tools/react";
import { useAuthConfig } from "../../hooks/useAuthConfig";
import { useNavigationHotkeys } from "../../hooks/useNavigationHotkeys";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { ProfileAvatar } from "../account/profileAvatar";
import { CodeBlock } from "./codeBlock";

interface StaticRoomCreator {
  avatarFileId: string | null;
  displayName: string;
}

interface StaticRoomContentProps {
  code: string;
  creator: StaticRoomCreator;
  editorLanguage: string;
  title: string;
}

function StaticRoomActionButton() {
  const { config, isLoading, refreshJwt, sessionKey } = useAuthConfig();

  if (isLoading === true) {
    return (
      <Button variant="primary" disabled>
        <span>[U]</span>
        <span>SIGN UP</span>
      </Button>
    );
  }

  const authKey = config.jwtToken === undefined ? `local-first:${sessionKey}` : `external:${sessionKey}`;

  return (
    <JazzProvider key={authKey} config={config} onJWTExpired={refreshJwt}>
      <ResolvedStaticRoomActionButton />
    </JazzProvider>
  );
}

function ResolvedStaticRoomActionButton() {
  const session = useSession();
  const profileIdentity = useProfileIdentity(session?.user_id ?? null);
  const hasCompletedProfile = profileIdentity.displayName !== null && profileIdentity.displayName.trim() !== "";
  const target = hasCompletedProfile === true ? "/dashboard" : "/sign-up";

  useNavigationHotkeys({
    dashboard: hasCompletedProfile === true,
    signUp: profileIdentity.isLoading === false && hasCompletedProfile === false,
  });

  if (profileIdentity.isLoading === true) {
    return (
      <Button variant="primary" disabled>
        <span>[U]</span>
        <span>SIGN UP</span>
      </Button>
    );
  }

  return (
    <Link to={target} className={buttonVariants({ variant: "primary" })}>
      {hasCompletedProfile === true ? (
        <>
          <span>[D]</span>
          <span>DASHBOARD</span>
        </>
      ) : (
        <>
          <span>[U]</span>
          <span>SIGN UP</span>
        </>
      )}
    </Link>
  );
}

export function StaticRoomContent(props: StaticRoomContentProps) {
  const language = getLanguage(props.editorLanguage);
  const LanguageLogo = language.logo;
  const title = props.title.trim().length > 0 ? props.title : "Untitled room";

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] bg-background text-foreground">
      <header className="flex h-9.5 items-center">
        <div className="flexrow-between-0 w-full px-3">
          <Link to="/" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <div className="h-4 w-4 rounded-xs bg-primary" />
          </Link>
          <StaticRoomActionButton />
        </div>
      </header>
      <div className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto flex w-full max-w-6xl flexcol-8">
        <section className="flexcol-6">
          <div className="flexrow-3 min-w-0">
            <span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground" title={language.name}>
              {LanguageLogo !== undefined ? <LanguageLogo className="size-7" /> : null}
            </span>
            <h1 className="min-w-0 text-2xl font-sans font-normal sm:text-3xl">{title}</h1>
          </div>

          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-4 text-sm">
            <dt className="font-sans font-normal text-muted-foreground">Language</dt>
            <dd className="flexrow-2 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                {LanguageLogo !== undefined ? <LanguageLogo className="size-5" /> : null}
              </span>
              <span className="truncate font-sans font-normal">{language.name}</span>
            </dd>

            <dt className="font-sans font-normal text-muted-foreground">Creator</dt>
            <dd className="flexrow-2 min-w-0">
              <ProfileAvatar avatarFileId={props.creator.avatarFileId} displayName={props.creator.displayName} imageClassName="size-5" loadTier="edge" size="sm" />
              <span className="truncate font-sans font-normal">{props.creator.displayName}</span>
            </dd>
          </dl>
        </section>

        <CodeBlock code={props.code} lang={language.value} />
        </div>
      </div>
    </main>
  );
}
