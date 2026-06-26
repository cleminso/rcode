import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { useEffect } from "react";

const themeMetaColor = {
  dark: "#FFD966",
  light: "#E7ABDD",
} as const;

function ThemeHeadEffects() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const theme = resolvedTheme === "dark" ? "dark" : "light";
    const faviconHref = theme === "dark" ? "/favicon-dark.svg" : "/favicon-light.svg";
    const themeColor = themeMetaColor[theme];
    const iconLinks = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"][data-rcode-theme-icon="true"]');
    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-rcode-theme-color="true"]');

    for (const iconLink of iconLinks) {
      iconLink.href = faviconHref;
    }

    if (themeColorMeta !== null) {
      themeColorMeta.content = themeColor;
    }
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHeadEffects />
      {children}
    </NextThemesProvider>
  );
}
