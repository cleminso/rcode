import Button from "@rcode/ui/button";
import { useTheme } from "next-themes";
import { accountThemes, type AccountTheme } from "./accountUtils";

interface ThemeTabsProps {
  className?: string;
}

export function ThemeTabs({ className }: ThemeTabsProps) {
  const { setTheme, theme } = useTheme();
  const selectedTheme = accountThemes.includes(theme as AccountTheme) === true ? (theme as AccountTheme) : "system";

  return (
    <div className={className}>
      {accountThemes.map((themeName) => (
        <Button
          className="text-xs uppercase"
          key={themeName}
          size="none"
          variant={selectedTheme === themeName ? "accent" : "ghost"}
          onClick={() => setTheme(themeName)}
        >
          <span>/</span>
          <span>{themeName}</span>
        </Button>
      ))}
    </div>
  );
}
