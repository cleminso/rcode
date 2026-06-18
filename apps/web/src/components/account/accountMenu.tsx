import Button from "@rcode/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rcode/ui/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { accountThemes, type AccountTheme } from "./accountUtils";
import { ProfileAvatar } from "./profileAvatar";

interface AccountMenuProps {
  avatarFileId?: string | null;
  displayName: string;
}

export function AccountMenu({ avatarFileId, displayName }: AccountMenuProps) {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const selectedTheme = accountThemes.includes(theme as AccountTheme) === true ? (theme as AccountTheme) : "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
        <ProfileAvatar avatarFileId={avatarFileId} className="rounded-xs" displayName={displayName} imageClassName="rounded-xs" size="default" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xs text-xs font-sans font-normal">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate text-foreground">{displayName}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate({ to: "/account"})}>
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-1 py-1">
          {accountThemes.map((themeName) => (
            <Button
              className="text-xs font-normal uppercase"
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
