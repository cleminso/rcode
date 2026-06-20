import {
  DropdownMenu as ShadDropdownMenu,
  DropdownMenuCheckboxItem as ShadDropdownMenuCheckboxItem,
  DropdownMenuContent as ShadDropdownMenuContent,
  DropdownMenuGroup as ShadDropdownMenuGroup,
  DropdownMenuItem as ShadDropdownMenuItem,
  DropdownMenuLabel as ShadDropdownMenuLabel,
  DropdownMenuPortal as ShadDropdownMenuPortal,
  DropdownMenuRadioGroup as ShadDropdownMenuRadioGroup,
  DropdownMenuRadioItem as ShadDropdownMenuRadioItem,
  DropdownMenuSeparator as ShadDropdownMenuSeparator,
  DropdownMenuShortcut as ShadDropdownMenuShortcut,
  DropdownMenuSub as ShadDropdownMenuSub,
  DropdownMenuSubContent as ShadDropdownMenuSubContent,
  DropdownMenuSubTrigger as ShadDropdownMenuSubTrigger,
  DropdownMenuTrigger as ShadDropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type DropdownMenuProps = React.ComponentProps<typeof ShadDropdownMenu>

const DropdownMenu = (props: DropdownMenuProps) => <ShadDropdownMenu {...props} />

DropdownMenu.displayName = "DropdownMenu"

export type DropdownMenuPortalProps = React.ComponentProps<typeof ShadDropdownMenuPortal>

const DropdownMenuPortal = (props: DropdownMenuPortalProps) => <ShadDropdownMenuPortal {...props} />

DropdownMenuPortal.displayName = "DropdownMenuPortal"

export type DropdownMenuTriggerProps = React.ComponentProps<typeof ShadDropdownMenuTrigger>

const DropdownMenuTrigger = (props: DropdownMenuTriggerProps) => <ShadDropdownMenuTrigger {...props} />

DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export type DropdownMenuContentProps = React.ComponentProps<typeof ShadDropdownMenuContent>

const DropdownMenuContent = ({ className, ...props }: DropdownMenuContentProps) => (
  <ShadDropdownMenuContent className={cn("w-52 rounded-xs text-xs font-sans font-normal", className)} {...props} />
)

DropdownMenuContent.displayName = "DropdownMenuContent"

export type DropdownMenuGroupProps = React.ComponentProps<typeof ShadDropdownMenuGroup>

const DropdownMenuGroup = (props: DropdownMenuGroupProps) => <ShadDropdownMenuGroup {...props} />

DropdownMenuGroup.displayName = "DropdownMenuGroup"

export type DropdownMenuLabelProps = React.ComponentProps<typeof ShadDropdownMenuLabel>

const DropdownMenuLabel = ({ className, ...props }: DropdownMenuLabelProps) => (
  <ShadDropdownMenuLabel className={cn("text-muted-foreground", className)} {...props} />
)

DropdownMenuLabel.displayName = "DropdownMenuLabel"

export type DropdownMenuItemProps = React.ComponentProps<typeof ShadDropdownMenuItem>

const DropdownMenuItem = ({ className, ...props }: DropdownMenuItemProps) => (
  <ShadDropdownMenuItem className={cn("rounded-xs focus:bg-muted focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground", className)} {...props} />
)

DropdownMenuItem.displayName = "DropdownMenuItem"

export type DropdownMenuCheckboxItemProps = React.ComponentProps<typeof ShadDropdownMenuCheckboxItem>

const DropdownMenuCheckboxItem = (props: DropdownMenuCheckboxItemProps) => <ShadDropdownMenuCheckboxItem {...props} />

DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

export type DropdownMenuRadioGroupProps = React.ComponentProps<typeof ShadDropdownMenuRadioGroup>

const DropdownMenuRadioGroup = (props: DropdownMenuRadioGroupProps) => <ShadDropdownMenuRadioGroup {...props} />

DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup"

export type DropdownMenuRadioItemProps = React.ComponentProps<typeof ShadDropdownMenuRadioItem>

const DropdownMenuRadioItem = (props: DropdownMenuRadioItemProps) => <ShadDropdownMenuRadioItem {...props} />

DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

export type DropdownMenuSeparatorProps = React.ComponentProps<typeof ShadDropdownMenuSeparator>

const DropdownMenuSeparator = (props: DropdownMenuSeparatorProps) => <ShadDropdownMenuSeparator {...props} />

DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export type DropdownMenuShortcutProps = React.ComponentProps<typeof ShadDropdownMenuShortcut>

const DropdownMenuShortcut = (props: DropdownMenuShortcutProps) => <ShadDropdownMenuShortcut {...props} />

DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export type DropdownMenuSubProps = React.ComponentProps<typeof ShadDropdownMenuSub>

const DropdownMenuSub = (props: DropdownMenuSubProps) => <ShadDropdownMenuSub {...props} />

DropdownMenuSub.displayName = "DropdownMenuSub"

export type DropdownMenuSubTriggerProps = React.ComponentProps<typeof ShadDropdownMenuSubTrigger>

const DropdownMenuSubTrigger = (props: DropdownMenuSubTriggerProps) => <ShadDropdownMenuSubTrigger {...props} />

DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

export type DropdownMenuSubContentProps = React.ComponentProps<typeof ShadDropdownMenuSubContent>

const DropdownMenuSubContent = ({ className, ...props }: DropdownMenuSubContentProps) => (
  <ShadDropdownMenuSubContent className={cn("rounded-xs text-xs font-sans font-normal", className)} {...props} />
)

DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
export default DropdownMenu
