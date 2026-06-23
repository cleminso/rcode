import { AvatarBadge } from "@rcode/ui/avatar";
import Button from "@rcode/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rcode/ui/dropdownMenu";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useLogout } from "../../hooks/useLogout";
import { accountThemes, type AccountTheme } from "./accountUtils";
import { ProfileAvatar } from "./profileAvatar";

interface AccountMenuProps {
  avatarFileId?: string | null;
  displayName: string;
  shouldShowSetupPrompt?: boolean;
}

export function AccountMenu({ avatarFileId, displayName, shouldShowSetupPrompt = false }: AccountMenuProps) {
  const navigate = useNavigate();
  const { isLoggingOut, logout } = useLogout();
  const { setTheme, theme } = useTheme();
  const selectedTheme = accountThemes.includes(theme as AccountTheme) === true ? (theme as AccountTheme) : "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
        <ProfileAvatar
          avatarFileId={avatarFileId}
          badge={shouldShowSetupPrompt === true ? <AvatarBadge className="-right-0.5 -top-0.5 size-2 rounded-full border border-background bg-destructive p-0" /> : null}
          className="rounded-xs"
          displayName={displayName}
          imageClassName="rounded-xs"
          size="default"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xs text-xs font-sans font-normal">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate text-foreground">{displayName}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="default" onClick={() => void navigate({ to: "/account" })}>
          <span>Settings</span>
          {shouldShowSetupPrompt === true ? <span className="ml-auto size-2 rounded-full bg-destructive" /> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-1 px-2 py-1">
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
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" disabled={isLoggingOut === true} onClick={() => void logout()}>
            <span>{isLoggingOut === true ? "Logging out..." : "Logout"}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
