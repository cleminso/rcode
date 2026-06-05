import { languages } from "@rcode/icons/languages";
import { Avatar, AvatarFallback, AvatarGroup } from "@rcode/ui/ui/avatar";
import { Button } from "@rcode/ui/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { EditorLayout } from "../layout/editorLayout";
import { EditorLanguageCombobox } from "./editorLanguageCombobox";
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
  const { editorLanguage, isLoading, shareToken, title, updateEditorLanguage, updateTitle } = useRoom();
  const navigate = useNavigate();

  const currentLanguageLogo = languages.find((language) => language.value === editorLanguage)?.logo;

  return (
    <EditorLayout
      toolbar={
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-5 rounded-sm bg-primary/60 text-primary-foreground hover:bg-primary"
              aria-label="Go to dashboard"
              onClick={() => void navigate({ to: "/dashboard" })}
            />
            <EditorLanguageCombobox
              value={editorLanguage}
              onValueChange={(nextEditorLanguage) => void updateEditorLanguage(nextEditorLanguage)}
            />
          </div>

          <RoomTitle
            logo={currentLanguageLogo}
            value={isLoading === true ? "" : title}
            onValueCommit={(nextTitle) => void updateTitle(nextTitle)}
          />

          <EditorActions key={shareToken} shareToken={shareToken} />
        </div>
      }
    >
      <div className="h-full bg-muted/30" />
    </EditorLayout>
  );
}

interface EditorActionsProps {
  shareToken: string;
}

function EditorActions(props: EditorActionsProps) {
  const [didCopyShareToken, setDidCopyShareToken] = useState(false);

  const handleShare = async () => {
    await navigator.clipboard.writeText(props.shareToken);
    setDidCopyShareToken(true);
  };

  return (
    <div className="flex min-w-0 items-center justify-end gap-3">
      {/*<AvatarGroup aria-label="Room participants">
        <Avatar size="sm" className="bg-emerald-300">
          <AvatarFallback className="bg-emerald-300 text-emerald-950">A</AvatarFallback>
        </Avatar>
        <Avatar size="sm" className="bg-sky-300">
          <AvatarFallback className="bg-sky-300 text-sky-950">B</AvatarFallback>
        </Avatar>
      </AvatarGroup>
      <Button type="button" variant="secondary" size="sm" onClick={() => void handleShare()}>
        {didCopyShareToken === true ? "Copied" : "Share"}
      </Button>
      <Avatar size="sm" aria-label="Current user">
        <AvatarFallback className="bg-sky-300 text-sky-950">U</AvatarFallback>
      </Avatar>*/}
    </div>
  );
}
