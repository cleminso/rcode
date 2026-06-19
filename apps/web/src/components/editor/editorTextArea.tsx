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

interface EditorTextAreaProps {
  onCursorPositionChange?: (line: number, column: number) => void;
}

export const EditorTextArea = memo(__EditorTextArea);

function __EditorTextArea(props: EditorTextAreaProps) {
  const { theme, systemTheme } = useTheme();
  const { awareness, canEdit, editorLanguage, isYjsReady, ydoc } = useRoom();
  const { settings } = useUserSettings();
  const [editorMounted, setEditorMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const resolvedTheme =
    theme === "system" ? systemTheme ?? "light" : theme ?? "light";
  const initialTheme = resolvedTheme === "dark" ? "zedokai" : "vitesse-light";

  const initialValue = useMemo(() => ydoc.getText("monaco").toString(), [ydoc]);

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

  useEffect(() => {
    if (editorMounted === false || editorRef.current === null) {
      return;
    }

    const editorInstance = editorRef.current;

    const reportPosition = () => {
      const position = editorInstance.getPosition();
      if (position !== null) {
        props.onCursorPositionChange?.(position.lineNumber, position.column);
      }
    };

    reportPosition();
    const disposable = editorInstance.onDidChangeCursorPosition(reportPosition);
    return () => {
      disposable.dispose();
    };
  }, [editorMounted, props.onCursorPositionChange]);

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
