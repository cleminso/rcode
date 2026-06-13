import { useCallback, useEffect, useRef, useState } from "react";

interface UseClipboardResult {
  copied: boolean;
  error: Error | null;
  copy: (text: string) => Promise<void>;
}

export function useClipboard(timeout = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      try {
        await navigator.clipboard.writeText(text);
        setError(null);
        setCopied(true);
        timeoutRef.current = window.setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, timeout);
      } catch (unknownError) {
        const nextError = unknownError instanceof Error ? unknownError : new Error("Failed to copy text.");

        setCopied(false);
        setError(nextError);
        throw nextError;
      }
    },
    [timeout],
  );

  return { copied, error, copy };
}
