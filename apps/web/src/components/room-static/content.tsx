import { getLanguage } from "@rcode/icons/languages";
import Button from "@rcode/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useNavigationHotkeys } from "../../hooks/useNavigationHotkeys";
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

export function StaticRoomContent(props: StaticRoomContentProps) {
  const navigate = useNavigate();
  useNavigationHotkeys({ signUp: true });
  const language = getLanguage(props.editorLanguage);
  const LanguageLogo = language.logo;
  const title = props.title.trim().length > 0 ? props.title : "Untitled room";

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] bg-background text-foreground">
      <header className="flex h-[38px] items-center">
        <div className="flex w-full items-center justify-between px-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
            <div className="h-4 w-4 rounded-xs bg-primary" />
          </Button>
          <Button variant="primary" onClick={() => navigate({ to: "/sign-up" })}>
            <span>[U]</span>
            <span>SIGN UP</span>
          </Button>
        </div>
      </header>
      <div className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="flex flex-col gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground" title={language.name}>
              {LanguageLogo !== undefined ? <LanguageLogo className="size-7" /> : null}
            </span>
            <h1 className="min-w-0 text-2xl font-sans font-normal sm:text-3xl">{title}</h1>
          </div>

          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-4 text-sm">
            <dt className="font-medium font-sans font-normal text-muted-foreground">Language</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                {LanguageLogo !== undefined ? <LanguageLogo className="size-5" /> : null}
              </span>
              <span className="truncate font-sans font-normal">{language.name}</span>
            </dd>

            <dt className="font-medium font-sans font-normal text-muted-foreground">Creator</dt>
            <dd className="flex min-w-0 items-center gap-2">
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
