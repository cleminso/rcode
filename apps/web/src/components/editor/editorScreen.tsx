import { languages } from "@rcode/icons/languages";
import { Button } from "@rcode/ui/ui/button";
import { useNavigate } from "@tanstack/react-router";
import type { Awareness } from "y-protocols/awareness";
import { EditorLayout } from "../layout/editorLayout";
import { EditorLanguageCombobox } from "./editorLanguageCombobox";
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
  const { awareness, editorLanguage, isLoading, title, updateEditorLanguage, updateTitle } = useRoom();
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

          <EditorActions awareness={awareness} />
        </div>
      }
    >
      <div className="h-full bg-muted/30">
        <EditorTextArea />
      </div>
    </EditorLayout>
  );
}

function EditorActions({ awareness }: { awareness: Awareness }) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-3">
      <EditorUsersList awareness={awareness} maxUsers={4} />
    </div>
  );
}
