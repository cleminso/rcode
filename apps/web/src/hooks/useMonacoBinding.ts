import type { editor } from "monaco-editor";
import { useEffect } from "react";
import { MonacoBinding } from "y-monaco";
import type * as Y from "yjs";

interface UseMonacoBindingArgs {
  editorInstance: editor.IStandaloneCodeEditor | null;
  isReady: boolean;
  ydoc: Y.Doc;
}

export function useMonacoBinding(args: UseMonacoBindingArgs) {
  const { editorInstance, isReady, ydoc } = args;

  useEffect(() => {
    if (editorInstance === null || isReady === false) {
      return;
    }

    const model = editorInstance.getModel();

    if (model === null) {
      return;
    }

    // Bind only once Jazz/Yjs bootstrap is complete so Monaco does not seed an
    // empty model into a room doc with remote updates unapplied.
    const binding = new MonacoBinding(ydoc.getText("monaco"), model, new Set([editorInstance]));

    return () => {
      binding.destroy();
    };
  }, [editorInstance, isReady, ydoc]);
}
