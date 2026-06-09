import { useEffect, useMemo, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import { colors } from "../../lib/awareness";
import type { AwarenessState } from "../../hooks/useRoomAwareness";
import type { BaseColor } from "../../lib/awareness";
import "./cursors.css";

interface CursorsProps {
  awareness: Awareness;
}

interface SelectionState {
  selection?: unknown;
}

function getAwarenessEntries(awareness: Awareness) {
  return Array.from(awareness.getStates()) as Array<[number, AwarenessState]>;
}

function escapeCssContent(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\A ");
}

export function Cursors(props: CursorsProps) {
  const { awareness } = props;
  const [awarenessEntries, setAwarenessEntries] = useState(() => getAwarenessEntries(awareness));

  useEffect(() => {
    const handleChange = () => {
      setAwarenessEntries(getAwarenessEntries(awareness));
    };

    handleChange();
    awareness.on("change", handleChange);

    return () => {
      awareness.off("change", handleChange);
    };
  }, [awareness]);

  const styleText = useMemo(() => {
    return awarenessEntries
      .filter(([clientId, state]) => {
        const selectionState = state as AwarenessState & SelectionState;
        return clientId !== awareness.clientID && selectionState.selection !== undefined;
      })
      .map(([clientId, state]) => {
        const user = state.user;
        // y-monaco decorates remote selections with classes that include the
        // remote Awareness client id. We inject per-client CSS variables instead
        // of rendering cursor DOM ourselves.
        const colorKey: BaseColor = user?.color ?? "blue";
        const color = colors[colorKey];
        const displayName = escapeCssContent(user?.displayName ?? "Collaborator");

        return `.yRemoteSelection-${clientId}, .yRemoteSelectionHead-${clientId} { --rcode-cursor: ${color.cursor}; --rcode-cursor-selection: ${color.cursorSelection}; } .yRemoteSelectionHead-${clientId}::after { content: "${displayName}"; }`;
      })
      .join("\n");
  }, [awareness.clientID, awarenessEntries]);

  return <style>{styleText}</style>;
}
