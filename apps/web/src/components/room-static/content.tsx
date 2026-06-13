import { getLanguage } from "@rcode/icons/languages";
import { Avatar, AvatarFallback, AvatarImage } from "@rcode/ui/ui/avatar";
import { CodeBlock } from "./codeBlock";

interface StaticRoomCreator {
  avatar: string | null;
  displayName: string;
}

interface StaticRoomContentProps {
  code: string;
  creator: StaticRoomCreator;
  editorLanguage: string;
  title: string;
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StaticRoomContent(props: StaticRoomContentProps) {
  const language = getLanguage(props.editorLanguage);
  const LanguageLogo = language.logo;
  const title = props.title.trim().length > 0 ? props.title : "Untitled room";

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="flex flex-col gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground" title={language.name}>
              {LanguageLogo !== undefined ? <LanguageLogo className="size-7" /> : null}
            </span>
            <h1 className="truncate text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{title}</h1>
          </div>

          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-4 text-sm">
            <dt className="font-medium text-muted-foreground">Language</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                {LanguageLogo !== undefined ? <LanguageLogo className="size-4" /> : null}
              </span>
              <span className="truncate">{language.name}</span>
            </dd>

            <dt className="font-medium text-muted-foreground">Creator</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={props.creator.avatar ?? undefined} alt={props.creator.displayName} />
                <AvatarFallback>{getInitials(props.creator.displayName)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{props.creator.displayName}</span>
            </dd>
          </dl>
        </section>

        <CodeBlock code={props.code} lang={language.value} />
      </div>
    </main>
  );
}
