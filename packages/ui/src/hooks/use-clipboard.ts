import { useCallback, useRef, useState } from "react";

interface UseClipboardResult {
  copied: boolean;
  copy: (text: string) => void;
}

export function useClipboard(timeout = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, timeout);
    },
    [timeout],
  );

  return { copied, copy };
}
