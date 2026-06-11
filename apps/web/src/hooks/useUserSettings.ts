import { app } from "@rcode/schema";
import { useEffect, useRef } from "react";
import { useAll, useDb, useSession } from "jazz-tools/react";

export interface EditorSettings extends Record<string, unknown> {
  // Font & Layout
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontLigatures?: boolean;
  fontVariations?: boolean;

  // Editor Behavior
  tabSize?: number;
  insertSpaces?: boolean;
  detectIndentation?: boolean;
  trimAutoWhitespace?: boolean;
  autoIndent?: "none" | "keep" | "brackets" | "advanced" | "full";
  autoIndentOnPaste?: boolean;
  autoIndentOnPasteWithinString?: boolean;
  formatOnType?: boolean;
  formatOnPaste?: boolean;
  dragAndDrop?: boolean;
  links?: boolean;
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded";
  wordWrapColumn?: number;
  wrappingIndent?: "none" | "same" | "indent" | "deepIndent";
  wrappingStrategy?: "simple" | "advanced";
  wordBreak?: "normal" | "keepAll";
  wordWrapOverride1?: "off" | "on" | "inherit";
  wordWrapOverride2?: "off" | "on" | "inherit";
  wrapOnEscapedLineFeeds?: boolean;
  wordWrapBreakBeforeCharacters?: string;
  wordWrapBreakAfterCharacters?: string;
  scrollBeyondLastLine?: boolean;
  scrollBeyondLastColumn?: number;
  smoothScrolling?: boolean;
  scrollOnMiddleClick?: boolean;
  mouseWheelZoom?: boolean;
  mouseWheelScrollSensitivity?: number;
  fastScrollSensitivity?: number;
  scrollPredominantAxis?: boolean;
  inertialScroll?: boolean;
  cursorBlinking?: "blink" | "smooth" | "phase" | "expand" | "solid";
  cursorStyle?: "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin";
  cursorWidth?: number;
  cursorHeight?: number;
  cursorSmoothCaretAnimation?: "off" | "explicit" | "on";
  overtypeCursorStyle?: "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin";
  overtypeOnPaste?: boolean;
  multiCursorModifier?: "ctrlCmd" | "alt";
  multiCursorMergeOverlapping?: boolean;
  multiCursorPaste?: "spread" | "full";
  multiCursorLimit?: number;
  mouseStyle?: "text" | "default" | "copy";
  mouseMiddleClickAction?: "default" | "openLink" | "ctrlLeftClick";
  columnSelection?: boolean;
  selectionClipboard?: boolean;
  emptySelectionClipboard?: boolean;
  copyWithSyntaxHighlighting?: boolean;
  stickyTabStops?: boolean;
  useTabStops?: boolean;
  trimWhitespaceOnDelete?: boolean;
  autoClosingBrackets?: "always" | "languageDefined" | "beforeWhitespace" | "never";
  autoClosingComments?: "always" | "languageDefined" | "beforeWhitespace" | "never";
  autoClosingQuotes?: "always" | "languageDefined" | "beforeWhitespace" | "never";
  autoClosingDelete?: "always" | "never" | "auto";
  autoClosingOvertype?: "always" | "never" | "auto";
  autoSurround?: "languageDefined" | "quotes" | "brackets" | "never";
  acceptSuggestionOnEnter?: "on" | "smart" | "off";
  acceptSuggestionOnCommitCharacter?: boolean;
  suggestOnTriggerCharacters?: boolean;
  snippetSuggestions?: "top" | "bottom" | "inline" | "none";
  tabCompletion?: "on" | "off" | "onlySnippets";
  suggestSelection?: "first" | "recentlyUsed" | "recentlyUsedByPrefix";
  suggestFontSize?: number;
  suggestLineHeight?: number;
  quickSuggestions?: boolean;
  quickSuggestionsDelay?: number;
  parameterHints?: { enabled?: boolean; cycle?: boolean };
  lightbulb?: { enabled?: any };
  codeActionsOnSaveTimeout?: number;
  unfoldOnClickAfterEndOfLine?: boolean;
  foldingMaximumRegions?: number;
  foldingImportsByDefault?: boolean;
  foldingHighlight?: boolean;
  foldingStrategy?: "auto" | "indentation";
  experimentalGpuAcceleration?: "on" | "off";
  experimentalWhitespaceRendering?: "svg" | "font" | "off";

  // Visual
  lineNumbers?: "on" | "off" | "relative" | "interval";
  lineNumbersMinChars?: number;
  glyphMargin?: boolean;
  renderLineHighlight?: "none" | "gutter" | "line" | "all";
  renderLineHighlightOnlyWhenFocus?: boolean;
  renderWhitespace?: "none" | "boundary" | "selection" | "trailing" | "all";
  renderControlCharacters?: boolean;
  showFoldingControls?: "always" | "never" | "mouseover";
  folding?: boolean;
  minimap?: { enabled: boolean };
  stickyScroll?: { enabled: boolean; maxLineCount?: number; defaultModel?: "outlineModel" | "foldingProviderModel" | "indentationModel"; scrollWithEditor?: boolean };
  bracketPairColorization?: { enabled: boolean };
  guides?: { bracketPairs?: boolean | "active"; bracketPairsHorizontal?: boolean | "active"; indentation?: boolean };
  colorDecorators?: boolean;
  colorDecoratorsActivatedOn?: "clickAndHover" | "click" | "hover";
  colorDecoratorsLimit?: number;
  inlayHints?: { enabled?: "on" | "off" | "offUnlessPressed" | "onUnlessPressed"; fontSize?: number; fontFamily?: string; padding?: boolean; maximumLength?: number; };
  unicodeHighlight?: { invisibleCharacters?: boolean; ambiguousCharacters?: boolean };
  selectionHighlight?: boolean;
  selectionHighlightMultiline?: boolean;
  selectionHighlightMaxLength?: number;
  occurrencesHighlight?: "off" | "singleFile" | "multiFile";
  occurrencesHighlightDelay?: number;
  showUnused?: boolean;
  showDeprecated?: boolean;
  matchOnWordStartOnly?: boolean;
  matchBrackets?: "never" | "near" | "always";
  codeLens?: boolean;
  codeLensFontFamily?: string;
  codeLensFontSize?: number;
  peekWidgetDefaultFocus?: "tree" | "editor";
  definitionLinkOpensInPeek?: boolean;
  useShadowDOM?: boolean;
  editContext?: boolean;
  renderRichScreenReaderContent?: boolean;
  pasteAs?: { enabled?: boolean; showPasteSelector?: "afterPaste" | "never"; };
  tabFocusMode?: boolean;
  inlineCompletionsAccessibilityVerbose?: boolean;

  // UI
  padding?: { top: number; bottom: number };
  scrollbar?: {
    vertical?: "auto" | "visible" | "hidden";
    horizontal?: "auto" | "visible" | "hidden";
    useShadows?: boolean;
    verticalHasArrows?: boolean;
    horizontalHasArrows?: boolean;
  };
  contextmenu?: boolean;
  hover?: { enabled: boolean; delay?: number; sticky?: boolean };
  rulers?: number[];
  wordSeparators?: string;
  wordSegmenterLocales?: string | string[];
  lineDecorationsWidth?: number | string;
  revealHorizontalRightPadding?: number;
  roundedSelection?: boolean;
  extraEditorClassName?: string;
  renderValidationDecorations?: "editable" | "on" | "off";
  fixedOverflowWidgets?: boolean;
  allowOverflow?: boolean;
  overviewRulerLanes?: number;
  overviewRulerBorder?: boolean;
  hideCursorInOverviewRuler?: boolean;
  linkedEditing?: boolean;
  renameOnType?: boolean;
  defaultColorDecorators?: "auto" | "always" | "never";
  disableLayerHinting?: boolean;
  disableMonospaceOptimizations?: boolean;
  stopRenderingLineAfter?: number;
  comments?: { insertSpace?: boolean; ignoreEmptyLines?: boolean };
  renderFinalNewline?: "on" | "off" | "dimmed";
  unusualLineTerminators?: "auto" | "off" | "prompt";
  selectOnLineNumbers?: boolean;
  placeholder?: string;

  // Accessibility
  accessibilitySupport?: "auto" | "off" | "on";
  accessibilityPageSize?: number;
  accessibilityHelpUrl?: string;
  ariaLabel?: string;
  ariaRequired?: boolean;
  screenReaderAnnounceInlineSuggestion?: boolean;
  stablePeek?: boolean;
  maxTokenizationLineLength?: number;
  "semanticHighlighting.enabled"?: true | false | "configuredByTheme";
  wordBasedSuggestions?: "off" | "currentDocument" | "matchingDocuments" | "allDocuments";
  wordBasedSuggestionsOnlySameLanguage?: boolean;
  largeFileOptimizations?: boolean;
  inDiffEditor?: boolean;
  allowVariableLineHeights?: boolean;
  allowVariableFonts?: boolean;
  allowVariableFontsInAccessibilityMode?: boolean;
  tabIndex?: number;
  readOnly?: boolean;
  readOnlyMessage?: string;
  domReadOnly?: boolean;
}

// Default editor settings applied when a user has no persisted preferences.
const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  fontLigatures: true,
  letterSpacing: -0.25,
  lineNumbers: "on",
  minimap: { enabled: false },
  padding: { top: 16, bottom: 16 },
  renderLineHighlight: "all",
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  autoIndent: "full",
  formatOnPaste: true,
  formatOnType: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: false, bracketPairsHorizontal: false, indentation: false },
  stickyScroll: { enabled: true },
  folding: true,
  showFoldingControls: "mouseover",
  smoothScrolling: true,
  cursorSmoothCaretAnimation: "off",
  multiCursorModifier: "ctrlCmd",
  links: true,
  colorDecorators: true,
  copyWithSyntaxHighlighting: true,
  unicodeHighlight: { invisibleCharacters: true, ambiguousCharacters: false },
  scrollbar: { vertical: "auto", horizontal: "auto", useShadows: false },
  fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export interface UserSettings {
  editor: EditorSettings;
}

export function useUserSettings() {
  const db = useDb();
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const canEditSession =
    session !== null &&
    (session.authMode === "local-first" || session.authMode === "external");

  const settingsRows = useAll(
    canEditSession === true && sessionUserId !== null
      ? app.userSettings.where({ session_user_id: sessionUserId }).limit(1)
      : undefined,
  );

  const settingsRow = settingsRows?.[0] ?? null;
  const isLoading = settingsRows === undefined;
  const initializedSessionUserIdRef = useRef<string | null>(null);

  const editorSettings =
    settingsRow !== null &&
    settingsRow.editor !== null &&
    typeof settingsRow.editor === "object" &&
    !Array.isArray(settingsRow.editor)
      ? (settingsRow.editor as Record<string, unknown>)
      : {};

  const settings: UserSettings = {
    editor: {
      ...DEFAULT_EDITOR_SETTINGS,
      ...(editorSettings as EditorSettings),
      guides: {
        ...DEFAULT_EDITOR_SETTINGS.guides,
        ...(editorSettings as EditorSettings).guides,
      },
    },
  };

  useEffect(() => {
    if (initializedSessionUserIdRef.current === sessionUserId) {
      return;
    }

    if (sessionUserId === null || canEditSession === false || isLoading === true) {
      return;
    }

    if (settingsRow !== null) {
      initializedSessionUserIdRef.current = sessionUserId;
      return;
    }

    initializedSessionUserIdRef.current = sessionUserId;

    void db
      .insert(app.userSettings, {
        session_user_id: sessionUserId,
        editor: DEFAULT_EDITOR_SETTINGS as any,
      })
      .wait({ tier: "edge" })
      .catch(() => {
        if (initializedSessionUserIdRef.current === sessionUserId) {
          initializedSessionUserIdRef.current = null;
        }
      });
  }, [canEditSession, db, isLoading, sessionUserId, settingsRow]);

  return {
    settings,
    isLoading,
    updateSettings: (next: Partial<EditorSettings>) => {
      if (settingsRow === null || sessionUserId === null) {
        return;
      }

      const merged = { ...editorSettings, ...next };

      void db
        .update(app.userSettings, settingsRow.id, { editor: merged as any })
        .wait({ tier: "edge" });
    },
  };
}
