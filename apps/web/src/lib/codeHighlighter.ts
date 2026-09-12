import type { LanguageValue } from "@rcode/icons/languages";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import type { LanguageRegistration } from "shiki/types";
import { vitesseDark, vitesseLight, zedokai, zedokaiDarker } from "../components/editor/themes";

type HighlightLanguage = Exclude<LanguageValue, "plaintext">;
type LanguageModuleLoader = () => Promise<{ default: LanguageRegistration[] }>;
type LanguageLoader = () => Promise<LanguageRegistration[]>;

function combineLanguageModules(...loaders: LanguageModuleLoader[]): LanguageLoader {
  return async () => {
    const modules = await Promise.all(loaders.map((load) => load()));
    return modules.flatMap((module) => module.default);
  };
}

const languageLoaders = {
  bat: combineLanguageModules(() => import("@shikijs/langs/bat")),
  cpp: combineLanguageModules(() => import("@shikijs/langs/c"), () => import("@shikijs/langs/cpp")),
  css: combineLanguageModules(() => import("@shikijs/langs/css")),
  dockerfile: combineLanguageModules(
    () => import("@shikijs/langs/shellscript"),
    () => import("@shikijs/langs/dockerfile"),
  ),
  go: combineLanguageModules(() => import("@shikijs/langs/go")),
  graphql: combineLanguageModules(() => import("@shikijs/langs/graphql")),
  html: combineLanguageModules(
    () => import("@shikijs/langs/css"),
    () => import("@shikijs/langs/javascript"),
    () => import("@shikijs/langs/html"),
  ),
  java: combineLanguageModules(() => import("@shikijs/langs/java")),
  javascript: combineLanguageModules(() => import("@shikijs/langs/javascript")),
  json: combineLanguageModules(() => import("@shikijs/langs/json")),
  lua: combineLanguageModules(() => import("@shikijs/langs/lua")),
  markdown: combineLanguageModules(
    () => import("@shikijs/langs/html"),
    () => import("@shikijs/langs/markdown"),
  ),
  "objective-c": combineLanguageModules(
    () => import("@shikijs/langs/c"),
    () => import("@shikijs/langs/objective-c"),
  ),
  pascal: combineLanguageModules(() => import("@shikijs/langs/pascal")),
  perl: combineLanguageModules(() => import("@shikijs/langs/perl")),
  php: combineLanguageModules(
    () => import("@shikijs/langs/css"),
    () => import("@shikijs/langs/javascript"),
    () => import("@shikijs/langs/html"),
    () => import("@shikijs/langs/php"),
  ),
  powershell: combineLanguageModules(() => import("@shikijs/langs/powershell")),
  python: combineLanguageModules(() => import("@shikijs/langs/python")),
  r: combineLanguageModules(() => import("@shikijs/langs/r")),
  ruby: combineLanguageModules(() => import("@shikijs/langs/ruby")),
  rust: combineLanguageModules(() => import("@shikijs/langs/rust")),
  scheme: combineLanguageModules(() => import("@shikijs/langs/scheme")),
  scss: combineLanguageModules(
    () => import("@shikijs/langs/css"),
    () => import("@shikijs/langs/scss"),
  ),
  shell: combineLanguageModules(() => import("@shikijs/langs/shellscript")),
  sql: combineLanguageModules(() => import("@shikijs/langs/sql")),
  typescript: combineLanguageModules(
    () => import("@shikijs/langs/javascript"),
    () => import("@shikijs/langs/typescript"),
  ),
  tsx: combineLanguageModules(
    () => import("@shikijs/langs/javascript"),
    () => import("@shikijs/langs/typescript"),
    () => import("@shikijs/langs/jsx"),
    () => import("@shikijs/langs/tsx"),
  ),
  xml: combineLanguageModules(() => import("@shikijs/langs/xml")),
  yaml: combineLanguageModules(() => import("@shikijs/langs/yaml")),
} satisfies Record<HighlightLanguage, LanguageLoader>;

let highlighterPromise: Promise<HighlighterCore> | null = null;
const languageLoadPromises = new Map<HighlightLanguage, Promise<void>>();

function getHighlighter() {
  if (highlighterPromise === null) {
    const pendingHighlighter = createHighlighterCore({
      themes: [vitesseLight, vitesseDark, zedokai, zedokaiDarker],
      langs: [],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
    highlighterPromise = pendingHighlighter;

    void pendingHighlighter.catch(() => {
      if (highlighterPromise === pendingHighlighter) {
        highlighterPromise = null;
      }
    });
  }

  return highlighterPromise;
}

export async function getCodeHighlighter(language: string) {
  const highlighter = await getHighlighter();

  if (language === "plaintext" || Object.hasOwn(languageLoaders, language) === false) {
    return { highlighter, language: "plaintext" } as const;
  }

  const supportedLanguage = language as HighlightLanguage;
  let loadPromise = languageLoadPromises.get(supportedLanguage);

  if (loadPromise === undefined) {
    loadPromise = highlighter.loadLanguage(languageLoaders[supportedLanguage]);
    languageLoadPromises.set(supportedLanguage, loadPromise);
  }

  try {
    await loadPromise;
  } catch (error) {
    languageLoadPromises.delete(supportedLanguage);
    throw error;
  }

  return { highlighter, language: supportedLanguage } as const;
}
