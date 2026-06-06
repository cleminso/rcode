import { useEffect, useMemo, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type { AwarenessColorName, AwarenessState } from "../../hooks/useRoomAwareness";
import "./cursors.css";

interface CursorsProps {
  awareness: Awareness;
}

interface CursorColor {
  cursor: string;
  selection: string;
}

interface SelectionState {
  selection?: unknown;
}

const cursorColors: Record<AwarenessColorName, CursorColor> = {
  amber: {
    cursor: "oklch(0.666 0.179 58.318)",
    selection: "oklch(0.666 0.179 58.318 / 18%)",
  },
  blue: {
    cursor: "oklch(0.623 0.214 259.815)",
    selection: "oklch(0.623 0.214 259.815 / 18%)",
  },
  cyan: {
    cursor: "oklch(0.715 0.143 215.221)",
    selection: "oklch(0.715 0.143 215.221 / 18%)",
  },
  emerald: {
    cursor: "oklch(0.596 0.145 163.225)",
    selection: "oklch(0.596 0.145 163.225 / 18%)",
  },
  rose: {
    cursor: "oklch(0.645 0.246 16.439)",
    selection: "oklch(0.645 0.246 16.439 / 18%)",
  },
  violet: {
    cursor: "oklch(0.606 0.25 292.717)",
    selection: "oklch(0.606 0.25 292.717 / 18%)",
  },
};

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
        const color = user !== undefined ? cursorColors[user.color] : cursorColors.emerald;
        const displayName = escapeCssContent(user?.displayName ?? "Collaborator");

        return `.yRemoteSelection-${clientId}, .yRemoteSelectionHead-${clientId} { --rcode-cursor: ${color.cursor}; --rcode-cursor-selection: ${color.selection}; } .yRemoteSelectionHead-${clientId}::after { content: "${displayName}"; }`;
      })
      .join("\n");
  }, [awareness.clientID, awarenessEntries]);

  return <style>{styleText}</style>;
}
