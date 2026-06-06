import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useState } from "react";
import { useMonacoBinding } from "../../hooks/useMonacoBinding";
import { Cursors } from "./cursors";
import { useRoom } from "./roomProvider";

export function EditorTextArea() {
  const { awareness, canEdit, editorLanguage, isYjsReady, ydoc } = useRoom();
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (mountedEditor) => {
    setEditorInstance(mountedEditor);
  };

  useMonacoBinding({ awareness, editorInstance, isReady: isYjsReady, ydoc });

  return (
    <>
      <Cursors awareness={awareness} />
      <MonacoEditor
        height="100%"
        width="100%"
        loading={null}
        defaultLanguage={editorLanguage}
        language={editorLanguage}
        theme="vs"
        onMount={handleMount}
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
