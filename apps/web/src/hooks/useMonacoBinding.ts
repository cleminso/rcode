import type { editor } from "monaco-editor";
import { useEffect } from "react";
import type { Awareness } from "y-protocols/awareness";
import { MonacoBinding } from "y-monaco";
import type * as Y from "yjs";

interface UseMonacoBindingArgs {
  awareness: Awareness;
  editorInstance: editor.IStandaloneCodeEditor | null;
  isReady: boolean;
  ydoc: Y.Doc;
}

export function useMonacoBinding(args: UseMonacoBindingArgs) {
  const { awareness, editorInstance, isReady, ydoc } = args;

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
    // Passing Awareness lets y-monaco publish local selections and render remote
    // selections using its yRemoteSelection-* decoration classes.
    const binding = new MonacoBinding(ydoc.getText("monaco"), model, new Set([editorInstance]), awareness);

    return () => {
      binding.destroy();
    };
  }, [awareness, editorInstance, isReady, ydoc]);
}
