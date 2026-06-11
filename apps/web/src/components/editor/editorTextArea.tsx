import MonacoEditor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { shikiToMonaco } from "@shikijs/monaco";
import { createHighlighter } from "shiki";
import { useMonacoBinding } from "../../hooks/useMonacoBinding";
import { useUserSettings } from "../../hooks/useUserSettings";
import { Cursors } from "./cursors";
import { languages } from "@rcode/icons/languages";
import { useRoom } from "./roomProvider";
import { vitesseDark, vitesseLight, zedokai, zedokaiDarker } from "./themes";
import "./editor.css";

const highlighterPromise = createHighlighter({
  themes: [vitesseLight, vitesseDark, zedokai, zedokaiDarker],
  langs: languages.map((language) => language.value),
});

const READ_ONLY_MESSAGE = "Open this room with an editable Jazz identity to make changes.";

// `memo` prevents unnecessary re-renders when the parent updates with stable props.
// This component receives no props from its parent, so it only re-renders when its
// internal hooks (`useTheme`, `useRoom`) produce new values. If the parent re-renders
// for unrelated reasons (e.g. a route transition), `memo` blocks that cascade.
export const EditorTextArea = memo(__EditorTextArea);

function __EditorTextArea() {
  const { theme, systemTheme } = useTheme();
  const { awareness, canEdit, editorLanguage, isYjsReady, ydoc } = useRoom();
  const { settings } = useUserSettings();
  const [editorMounted, setEditorMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const resolvedTheme =
    theme === "system" ? systemTheme ?? "light" : theme ?? "light";
  const initialTheme = resolvedTheme === "dark" ? "zedokai" : "vitesse-light";

  // `useMemo` prevents re-running the ydoc -> string conversion on every render.
  // `ydoc.getText("monaco").toString()` is O(n) over the document length. On a large
  // file this creates garbage and blocks the main thread for no reason because the value
  // only changes when the `ydoc` reference changes.
  const initialValue = useMemo(() => ydoc.getText("monaco").toString(), [ydoc]);

  // Memoize the options object so the Monaco component receives a stable reference
  // across renders. In JavaScript, `{} !== {}` even when the contents are identical.
  // The `@monaco-editor/react` wrapper uses `options` in its internal effect
  // dependency array. Passing a new object on every render causes Monaco to re-apply
  // its editor configuration on every parent update, which is expensive
  // and can reset cursor position or focus.
  //
  // The generic type annotation is required because TypeScript widens unannotated
  // object literals, turning string literal values like "none" into the generic `string`
  // type. That breaks assignment to union-typed properties such as `renderLineHighlight`.
  //
  // User settings are merged so individual preferences override the defaults.
  // Non-preference options (readOnly, automaticLayout) are always set by the app.
  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      ...settings.editor,
      automaticLayout: true,
      readOnly: canEdit === false,
      readOnlyMessage: { value: READ_ONLY_MESSAGE },
    }),
    [canEdit, settings.editor],
  );

  useEffect(() => {
    if (editorMounted) {
      monacoRef.current?.editor.setTheme(
        resolvedTheme === "dark" ? "zedokai" : "vitesse-light",
      );
    }
  }, [editorMounted, resolvedTheme]);

  // `onMount` fires exactly once per editor instance. Memoizing the callback with
  // `useCallback` would add a hook call and dependency array bookkeeping for zero
  // benefit because the consumer never changes its reference check behavior.
  //
  // Rule: only wrap callbacks in `useCallback` when they are passed to
  // child components that use them in effect dependencies or are wrapped in `memo`.
  const setupEditor = async (
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: Monaco,
  ) => {
    editorInstance.focus();
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    const highlighter = await highlighterPromise;
    shikiToMonaco(highlighter, monacoInstance);
    monacoInstance.editor.setTheme(initialTheme);
    setEditorMounted(true);
  };

  useMonacoBinding({
    awareness,
    editorInstance: editorMounted ? editorRef.current : null,
    isReady: isYjsReady,
    ydoc,
  });

  return (
    <>
      <Cursors awareness={awareness} />
      <MonacoEditor
        height="100%"
        width="100%"
        loading={null}
        language={editorLanguage}
        theme={initialTheme}
        defaultValue={initialValue}
        onMount={setupEditor}
        options={options}
      />
    </>
  );
}
