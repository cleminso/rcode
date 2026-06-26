import { languages } from "@rcode/icons/languages";
import Button, { buttonVariants } from "@rcode/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rcode/ui/dropdownMenu";
import { Separator } from "@rcode/ui/ui/separator"
import { useHotkeys } from "@tanstack/react-hotkeys";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { CommandMenu } from "../command-menu/commandMenu";
import { EditorLayout } from "../layout/editorLayout";
import { AccountMenu } from "../account/accountMenu";
import { useNavigationHotkeys } from "../../hooks/useNavigationHotkeys";
import { EditorLanguageCombobox } from "./editorLanguagePicker";
import { EditorTextArea } from "./editorTextArea";
import { EditorUsersList } from "./editorUsersList";
import { RoomTitle } from "./roomTitle";
import { RoomProvider, useRoom } from "./roomProvider";

interface EditorScreenProps {
  shareToken: string;
}

function LogoButton() {
  return (
    <Link to="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" })}>
      <div className="h-4 w-4 rounded-xs bg-primary" />
    </Link>
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
  const { currentProfile, editorLanguage, isArchived, isCreator, isLoading, isYjsReady, roomExists, roomPresence, title, unarchiveRoom, updateEditorLanguage, updateTitle } = useRoom();
  const navigate = useNavigate();
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [titleEditRequest, setTitleEditRequest] = useState(0);
  const [switchRoomsRequest, setSwitchRoomsRequest] = useState(0);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number } | null>(null);

  const handleCursorPositionChange = useCallback((line: number, column: number) => {
    setCursorPosition({ line, column });
  }, []);

  const canAccessContent = roomExists === true && (isArchived === false || isCreator === true);

  useNavigationHotkeys({
    dashboard: isLoading === false && canAccessContent === false,
  });

  const isReady = isLoading === false && isYjsReady === true && canAccessContent === true;

  useHotkeys([
    {
      hotkey: "Escape",
      callback: () => {
        if (document.querySelector('[role="dialog"]') !== null) {
          return;
        }

        const activeElement = document.activeElement;

        if ((activeElement instanceof HTMLElement) === true) {
          const tagName = activeElement.tagName.toLowerCase();

          if (activeElement.isContentEditable === true || tagName === "input" || tagName === "select") {
            return;
          }
        }

        void navigate({ to: "/dashboard" });
      },
      options: {
        enabled: isReady,
        meta: { name: "Exit room" },
      },
    },
  ]);

  const currentLanguage = languages.find((language) => language.value === editorLanguage);
  const currentLanguageLogo = currentLanguage?.logo;

  const handleUnarchiveRoom = async () => {
    setIsUnarchiving(true);

    try {
      await unarchiveRoom();
    } finally {
      setIsUnarchiving(false);
    }
  };

  if (isLoading === false && canAccessContent === false) {
    return (
      <EditorLayout
        toolbar={
          <div className="flex h-full w-full items-center gap-2">
            <LogoButton />
            <Link to="/dashboard" className={buttonVariants({ variant: "ghost" })}>
              [D] DASHBOARD
            </Link>
          </div>
        }
        footer={
          <div className="flex w-full items-center justify-between">
          </div>
        }
      >
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-sm rounded-xs border border-border bg-card p-6">
            <h1 className="text-[16px] font-sans font-semibold ">
              {isArchived === true ? "This room has been archived" : "Room unavailable"}
            </h1>
            <p className="mt-2 text-xs font-sans font-normal text-muted-foreground">
              {isArchived === true
                ? "The room owner archived this room. It is not accessible from shared links."
                : "This room does not exist or is no longer available."}
            </p>
            <Link to="/dashboard" className={buttonVariants({ variant: "primary", className: "mt-4" })}>
              [D] DASHBOARD
            </Link>
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
                open={languagePickerOpen}
                value={editorLanguage}
                onOpenChange={setLanguagePickerOpen}
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
                onSwitchRooms={() => setSwitchRoomsRequest((currentRequest) => currentRequest + 1)}
                onValueCommit={(nextTitle) => void updateTitle(nextTitle)}
              />
          )}

          <div className="flex min-w-0 items-center justify-end gap-3">
            {isArchived === true && isCreator === true ? (
              <DropdownMenu>
                <div className="flex items-center gap-2">
                  <DropdownMenuTrigger render={<Button variant="ghost" size="default" />}>Unarchive</DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end" className="w-72 rounded-xs text-xs font-sans font-normal">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-foreground">Unarchive room</DropdownMenuLabel>
                    <div className="px-2 pb-1 text-xs/relaxed text-muted-foreground">
                      <div className="space-y-2 px-2 pb-1 text-xs/relaxed text-muted-foreground">
                        <p>Shared links are disabled while this room is archived. Unarchive this room to restore collaboration access.</p>
                        <p>You will stay in the room after it is restored.</p>
                      </div>
                    </div>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem disabled={isUnarchiving} className="rounded-xs !hover:bg-transparent !focus:bg-transparent" onClick={() => void handleUnarchiveRoom()}>
                      <span>{isUnarchiving === true ? "Restoring" : "Unarchive room"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <EditorUsersList maxUsers={4} presence={roomPresence} />
            )}
            <Separator orientation="vertical"></Separator>
            {currentProfile.isLoading === true || currentProfile.displayName === null ? (
              <div className="size-6 animate-pulse rounded-xs bg-muted" />
            ) : (
              <AccountMenu
                avatarFileId={currentProfile.avatarFileId}
                displayName={currentProfile.displayName}
                shouldShowSetupPrompt={currentProfile.shouldShowSetupPrompt}
              />
            )}
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          {cursorPosition !== null ? (
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
          ) : null}
        </div>
      }
    >
      {isReady === false ? (
        <div className="flex h-full items-center justify-center" />
      ) : (
        <div className="h-full">
          <CommandMenu
            switchRoomsRequest={switchRoomsRequest}
            onEditTitle={() => setTitleEditRequest((currentRequest) => currentRequest + 1)}
          />
          <EditorTextArea onCursorPositionChange={handleCursorPositionChange} />
        </div>
      )}
    </EditorLayout>
  );
}
