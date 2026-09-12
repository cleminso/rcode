import MonacoEditor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { shikiToMonaco } from "@shikijs/monaco";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import { useMonacoBinding } from "../../hooks/useMonacoBinding";
import { useUserSettings } from "../../hooks/useUserSettings";
import { getCodeHighlighter } from "../../lib/codeHighlighter";
import { Cursors } from "./cursors";
import "./editor.css";

const READ_ONLY_MESSAGE = "Open this room with an editable Jazz identity to make changes.";

interface EditorTextAreaProps {
  awareness: Awareness;
  canEdit: boolean;
  editorLanguage: string;
  isYjsReady: boolean;
  onCursorPositionChange?: (line: number, column: number) => void;
  ydoc: Y.Doc;
}

export const EditorTextArea = memo(__EditorTextArea);

function __EditorTextArea(props: EditorTextAreaProps) {
  const { theme, systemTheme } = useTheme();
  const { settings } = useUserSettings();
  const [editorMounted, setEditorMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const resolvedTheme =
    theme === "system" ? systemTheme ?? "light" : theme ?? "light";
  const initialTheme = resolvedTheme === "dark" ? "zedokai" : "vitesse-light";

  const initialValue = useMemo(() => props.ydoc.getText("monaco").toString(), [props.ydoc]);

  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      ...settings.editor,
      automaticLayout: true,
      readOnly: props.canEdit === false,
      readOnlyMessage: { value: READ_ONLY_MESSAGE },
    }),
    [props.canEdit, settings.editor],
  );

  useEffect(() => {
    if (editorMounted === false || monacoRef.current === null) {
      return;
    }

    let isActive = true;
    const monacoInstance = monacoRef.current;

    void getCodeHighlighter(props.editorLanguage)
      .then(({ highlighter }) => {
        if (isActive === false) {
          return;
        }

        shikiToMonaco(highlighter, monacoInstance);
        monacoInstance.editor.setTheme(initialTheme);
      })
      .catch((error: unknown) => {
        console.error("Failed to configure editor syntax highlighting.", error);
      });

    return () => {
      isActive = false;
    };
  }, [editorMounted, initialTheme, props.editorLanguage]);

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

  const setupEditor = (
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: Monaco,
  ) => {
    editorInstance.focus();
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    setEditorMounted(true);
  };

  useMonacoBinding({
    awareness: props.awareness,
    editorInstance: editorMounted ? editorRef.current : null,
    isReady: props.isYjsReady,
    ydoc: props.ydoc,
  });

  return (
    <>
      <Cursors awareness={props.awareness} />
      <MonacoEditor
        height="100%"
        width="100%"
        loading={null}
        language={props.editorLanguage}
        theme={initialTheme}
        defaultValue={initialValue}
        onMount={setupEditor}
        options={options}
      />
    </>
  );
}
