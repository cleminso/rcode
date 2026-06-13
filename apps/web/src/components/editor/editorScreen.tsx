import { languages } from "@rcode/icons/languages";
import { Separator } from "@rcode/ui/ui/separator";
import { Button } from "@rcode/ui/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import { CommandMenu } from "../command-menu/commandMenu";
import { EditorLayout } from "../layout/editorLayout";
import { EditorLanguageCombobox } from "./editorLanguagePicker";
import { EditorTextArea } from "./editorTextArea";
import { EditorUsersList } from "./editorUsersList";
import { RoomTitle } from "./roomTitle";
import { RoomProvider, useRoom } from "./roomProvider";

interface EditorScreenProps {
  shareToken: string;
}

export function EditorScreen(props: EditorScreenProps) {
  return (
    <RoomProvider shareToken={props.shareToken}>
      <EditorContent />
    </RoomProvider>
  );
}

function EditorContent() {
  const { awareness, editorLanguage, isArchived, isLoading, isYjsReady, roomExists, title, updateEditorLanguage, updateTitle } = useRoom();
  const navigate = useNavigate();
  const [titleEditRequest, setTitleEditRequest] = useState(0);

  const isReady = isLoading === false && isYjsReady === true && isArchived === false && roomExists === true;
  const currentLanguageLogo = languages.find((language) => language.value === editorLanguage)?.logo;

  if (isLoading === false && (roomExists === false || isArchived === true)) {
    return (
      <EditorLayout toolbar={<EditorToolbarSkeleton onDashboardClick={() => void navigate({ to: "/dashboard" })} />}>
        <div className="flex h-full items-center justify-center bg-muted/30 px-6 text-center">
          <div className="max-w-sm rounded-xl border bg-background p-6 shadow-sm">
            <h1 className="text-sm font-semibold tracking-[-0.01575em]">
              {isArchived === true ? "This room has been archived" : "Room unavailable"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isArchived === true
                ? "The room owner archived this room. It is not accessible from shared links."
                : "This room does not exist or is no longer available."}
            </p>
            <Button type="button" size="sm" className="mt-4" onClick={() => void navigate({ to: "/dashboard" })}>
              Go to dashboard
            </Button>
          </div>
        </div>
      </EditorLayout>
    );
  }

  return (
    <EditorLayout
      toolbar={
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary-foreground"
              aria-label="Go to dashboard"
              onClick={() => void navigate({ to: "/dashboard" })}
            >rcode</Button>
            <Separator className="mx-1" orientation="vertical" />
            {isReady === false ? (
              <div className="h-8 w-36 animate-pulse rounded bg-muted" />
            ) : (
              <EditorLanguageCombobox
                value={editorLanguage}
                onValueChange={(nextEditorLanguage) => void updateEditorLanguage(nextEditorLanguage)}
              />
            )}
          </div>

          {isReady === false ? (
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          ) : (
            <RoomTitle
              editRequest={titleEditRequest}
              logo={currentLanguageLogo}
              value={title}
              onValueCommit={(nextTitle) => void updateTitle(nextTitle)}
            />
          )}

          <EditorActions awareness={awareness} />
        </div>
      }
    >
      {isReady === false ? (
        <div className="flex h-full items-center justify-center bg-muted/30">
          {/*<div className="text-muted-foreground text-sm">Loading editor...</div>*/}
        </div>
      ) : (
        <div className="h-full bg-muted/30">
          <CommandMenu onEditTitle={() => setTitleEditRequest((currentRequest) => currentRequest + 1)} />
          <EditorTextArea />
        </div>
      )}
    </EditorLayout>
  );
}

function EditorToolbarSkeleton({ onDashboardClick }: { onDashboardClick: () => void }) {
  return (
    <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary-foreground"
          aria-label="Go to dashboard"
          onClick={onDashboardClick}
        >Dashboard</Button>
      </div>
      <div className="h-6 w-48 rounded bg-muted" />
      <div />
    </div>
  );
}

function EditorActions({ awareness }: { awareness: Awareness }) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-3">
      <EditorUsersList awareness={awareness} maxUsers={4} />
    </div>
  );
}
