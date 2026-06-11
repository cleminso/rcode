import MonacoEditor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { shikiToMonaco } from "@shikijs/monaco";
import { createHighlighter } from "shiki";
import { useMonacoBinding } from "../../hooks/useMonacoBinding";
import { Cursors } from "./cursors";
import { languages } from "@rcode/icons/languages";
import { useRoom } from "./roomProvider";
import { vitesseDark, vitesseLight, zedokai, zedokaiDarker } from "./themes";

const highlighterPromise = createHighlighter({
  themes: [vitesseLight, vitesseDark, zedokai, zedokaiDarker],
  langs: languages.map((language) => language.value),
});

// memo prevents unnecessary re-renders when the parent updates with stable props
export const EditorTextArea = memo(__EditorTextArea);

function __EditorTextArea() {
  const { theme, systemTheme } = useTheme();
  const { awareness, canEdit, editorLanguage, isYjsReady, ydoc } = useRoom();
  const [editorMounted, setEditorMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const resolvedTheme =
    theme === "system" ? systemTheme ?? "light" : theme ?? "light";
  const initialTheme = resolvedTheme === "dark" ? "zedokai" : "vitesse-light";

  useEffect(() => {
    if (editorMounted) {
      monacoRef.current?.editor.setTheme(
        resolvedTheme === "dark" ? "zedokai" : "vitesse-light",
      );
    }
  }, [editorMounted, resolvedTheme]);

  const setupEditor = useCallback(
    async (
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
    },
    [initialTheme],
  );

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
        // defaultLanguage={editorLanguage}
        language={editorLanguage}
        theme={initialTheme}
        defaultValue={ydoc.getText("monaco").toString()}
        onMount={setupEditor}
        options={{
          automaticLayout: true,
          fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontLigatures: true,
          fontSize: 14,
          minimap: { enabled: false },
          padding: { top: 16, bottom: 16 },
          readOnly: canEdit === false,
          readOnlyMessage: { value: "Open this room with an editable Jazz identity to make changes." },
          renderLineHighlight: "none",
          scrollBeyondLastLine: false,
        }}
      />
    </>
  );
}
