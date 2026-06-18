import { languages } from "@rcode/icons/languages";
import Button from "@rcode/ui/button";
import { Separator } from "@rcode/ui/ui/separator"
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CommandMenu } from "../command-menu/commandMenu";
import { EditorLayout } from "../layout/editorLayout";
import { AccountMenu } from "../account/accountMenu";
import { useCurrentProfile } from "../../hooks/useCurrentProfile";
import { EditorLanguageCombobox } from "./editorLanguagePicker";
import { EditorTextArea } from "./editorTextArea";
import { EditorUsersList } from "./editorUsersList";
import { RoomTitle } from "./roomTitle";
import { RoomProvider, useRoom } from "./roomProvider";

interface EditorScreenProps {
  shareToken: string;
}

function LogoButton() {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })}>
      <div className="h-4 w-4 rounded-xs bg-primary" />
    </Button>
  );
}

export function EditorScreen(props: EditorScreenProps) {
  return (
    <RoomProvider shareToken={props.shareToken}>
      <EditorContent />
    </RoomProvider>
  );
}

function EditorContent() {
  const { editorLanguage, isArchived, isLoading, isYjsReady, roomExists, roomPresence, title, updateEditorLanguage, updateTitle } = useRoom();
  const navigate = useNavigate();
  const currentProfile = useCurrentProfile({ autoCreate: false });
  const [titleEditRequest, setTitleEditRequest] = useState(0);

  const isReady = isLoading === false && isYjsReady === true && isArchived === false && roomExists === true;
  const currentLanguage = languages.find((language) => language.value === editorLanguage);
  const currentLanguageLogo = currentLanguage?.logo;

  if (isLoading === false && (roomExists === false || isArchived === true)) {
    return (
      <EditorLayout
        toolbar={
          <div className="flex h-full w-full items-center gap-2">
            <LogoButton />
            <Button variant="ghost" onClick={() => void navigate({ to: "/dashboard" })}>
              [D] DASHBOARD
            </Button>
          </div>
        }
        footer={
          <div className="flex w-full items-center justify-between">
            <span className="text-xs  text-muted-foreground">[T] THEME</span>
          </div>
        }
      >
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-sm rounded-xs border border-border bg-card p-6">
            <h1 className="text-[16px] font-semibold ">
              {isArchived === true ? "This room has been archived" : "Room unavailable"}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {isArchived === true
                ? "The room owner archived this room. It is not accessible from shared links."
                : "This room does not exist or is no longer available."}
            </p>
            <Button variant="primary" className="mt-4" onClick={() => void navigate({ to: "/dashboard" })}>
              [D] DASHBOARD
            </Button>
          </div>
        </div>
      </EditorLayout>
    );
  }

  return (
    <EditorLayout
      toolbar={
        <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <LogoButton />
            <Separator orientation="vertical"></Separator>
            {isReady === false ? (
              <div className="h-6.25 w-24 animate-pulse rounded-xs bg-muted" />
            ) : (
              <EditorLanguageCombobox
                value={editorLanguage}
                onValueChange={(nextEditorLanguage) => void updateEditorLanguage(nextEditorLanguage)}
              />
            )}
          </div>

          {isReady === false ? (
            <div className="h-6 w-48 animate-pulse rounded-xs bg-muted" />
          ) : (
            <RoomTitle
              editRequest={titleEditRequest}
              logo={currentLanguageLogo}
              value={title}
              onValueCommit={(nextTitle) => void updateTitle(nextTitle)}
            />
          )}

          <div className="flex min-w-0 items-center justify-end gap-3">
            <EditorUsersList maxUsers={4} presence={roomPresence} />
            <Separator orientation="vertical"></Separator>
            <AccountMenu
              avatarFileId={currentProfile.avatarFileId}
              displayName={currentProfile.displayName}
            />
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs  text-muted-foreground">[T] THEME</span>
          </div>
        </div>
      }
    >
      {isReady === false ? (
        <div className="flex h-full items-center justify-center" />
      ) : (
        <div className="h-full">
          <CommandMenu onEditTitle={() => setTitleEditRequest((currentRequest) => currentRequest + 1)} />
          <EditorTextArea />
        </div>
      )}
    </EditorLayout>
  );
}
