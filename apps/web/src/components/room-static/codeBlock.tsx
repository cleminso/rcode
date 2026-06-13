import { languages } from "@rcode/icons/languages";
import { cn } from "@rcode/ui/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { type BundledLanguage, createHighlighter } from "shiki";
import { vitesseLight, zedokai } from "../editor/themes";
import { CopyCodeButton } from "./copyCodeButton";

interface CodeBlockProps extends React.ComponentProps<"div"> {
  code: string;
  lang: string;
}

interface ScrollEdges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

const highlighterPromise = createHighlighter({
  themes: [vitesseLight, zedokai],
  // TODO: Load only the active room language once Shiki language loading behavior is verified.
  langs: languages.map((language) => language.value),
});

const initialScrollEdges: ScrollEdges = {
  top: true,
  right: true,
  bottom: true,
  left: true,
};

function getResolvedTheme(theme: string | undefined, systemTheme: string | undefined) {
  return theme === "system" ? systemTheme ?? "light" : theme ?? "light";
}

function areScrollEdgesEqual(left: ScrollEdges, right: ScrollEdges) {
  return left.top === right.top && left.right === right.right && left.bottom === right.bottom && left.left === right.left;
}

export function CodeBlock({ code, lang, className, ...props }: CodeBlockProps) {
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = getResolvedTheme(theme, systemTheme);
  const shikiTheme = resolvedTheme === "dark" ? "zedokai" : "vitesse-light";
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [scrollEdges, setScrollEdges] = useState<ScrollEdges>(initialScrollEdges);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lineNumbers = useMemo(() => {
    const lineCount = Math.max(1, code.split("\n").length);

    return Array.from({ length: lineCount }, (_entry, index) => index + 1);
  }, [code]);

  useEffect(() => {
    let isActive = true;

    void highlighterPromise.then((highlighter) => {
      const html = highlighter.codeToHtml(code, {
        lang: lang as BundledLanguage,
        theme: shikiTheme,
      });

      if (isActive === true) {
        setHighlightedHtml(html);
      }
    });

    return () => {
      isActive = false;
    };
  }, [code, lang, shikiTheme]);

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (scroller === null) {
      return;
    }

    const updateScrollEdges = () => {
      const nextEdges: ScrollEdges = {
        top: scroller.scrollTop <= 1,
        left: scroller.scrollLeft <= 1,
        right: scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1,
        bottom: scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1,
      };

      setScrollEdges((currentEdges) => {
        if (areScrollEdgesEqual(currentEdges, nextEdges) === true) {
          return currentEdges;
        }

        return nextEdges;
      });
    };

    updateScrollEdges();
    scroller.addEventListener("scroll", updateScrollEdges, { passive: true });
    window.addEventListener("resize", updateScrollEdges);

    return () => {
      scroller.removeEventListener("scroll", updateScrollEdges);
      window.removeEventListener("resize", updateScrollEdges);
    };
  }, [highlightedHtml]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-background shadow-sm",
        "[--room-static-code-bg:hsl(var(--background))]",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 z-10">
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-background to-transparent transition-opacity",
            scrollEdges.right === true ? "opacity-0" : "opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute top-0 left-14 h-full w-12 bg-gradient-to-r from-background to-transparent transition-opacity",
            scrollEdges.left === true ? "opacity-0" : "opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute top-0 left-14 h-12 w-full bg-gradient-to-b from-background to-transparent transition-opacity",
            scrollEdges.top === true ? "opacity-0" : "opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 left-14 h-12 w-full bg-gradient-to-t from-background to-transparent transition-opacity",
            scrollEdges.bottom === true ? "opacity-0" : "opacity-100",
          )}
        />
      </div>

      <div className="absolute top-3 right-3 z-20">
        <CopyCodeButton content={code} />
      </div>

      <div ref={scrollerRef} className="relative max-h-[70vh] overflow-auto" tabIndex={0}>
        <div className="grid min-w-max grid-cols-[3.5rem_1fr] py-4 font-mono text-xs leading-6 sm:text-sm">
          <div className="sticky left-0 z-20 flex select-none flex-col border-r bg-background pr-3 pl-4 text-right text-muted-foreground/60">
            {lineNumbers.map((lineNumber) => (
              <span key={lineNumber}>{lineNumber}</span>
            ))}
          </div>

          <div className="min-w-0 px-4 pr-14">
            {highlightedHtml !== null ? (
              <div
                className="[&_code]:!grid [&_code]:min-w-max [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!font-mono [&_pre]:!leading-6"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <pre className="m-0 font-mono leading-6 text-muted-foreground">Loading code.</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
