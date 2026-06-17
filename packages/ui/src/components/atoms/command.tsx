"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Command as CommandPrimitive } from "cmdk"
import { CheckIcon } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

export type CommandProps = React.ComponentProps<typeof CommandPrimitive>

const Command = ({ className, ...props }: CommandProps) => (
  <CommandPrimitive
    data-slot="command"
    className={cn(
      "flex size-full flex-col overflow-hidden rounded-sm bg-card text-card-foreground",
      className
    )}
    {...props}
  />
)

Command.displayName = "Command"

export type CommandDialogProps = Omit<
  DialogPrimitive.Root.Props,
  "children"
> & {
  title?: string
  description?: string
  className?: string
  overlayClassName?: string
  children: React.ReactNode
}

const CommandDialog = ({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  overlayClassName,
  ...props
}: CommandDialogProps) => (
  <DialogPrimitive.Root data-slot="command-dialog" {...props}>
    <DialogPrimitive.Portal data-slot="command-dialog-portal">
      <DialogPrimitive.Backdrop
        data-slot="command-dialog-overlay"
        className={cn("fixed inset-0 z-50 bg-transparent", overlayClassName)}
      />
      <DialogPrimitive.Popup
        data-slot="command-dialog-content"
        className={cn(
          "fixed top-24 left-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-sm border border-border/80 bg-card text-card-foreground shadow-2xl outline-none sm:max-w-3xl",
          className
        )}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          {description}
        </DialogPrimitive.Description>
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)

CommandDialog.displayName = "CommandDialog"

export type CommandInputProps = React.ComponentProps<
  typeof CommandPrimitive.Input
> & {
  wrapperClassName?: string
}

const CommandInput = ({
  className,
  wrapperClassName,
  ...props
}: CommandInputProps) => (
  <div
    data-slot="command-input-wrapper"
    className={cn("border-b border-border/70 font-sans font-normal", wrapperClassName)}
  >
    <CommandPrimitive.Input
      data-slot="command-input"
      className={cn(
        "h-10 w-full border-0 bg-transparent px-4 text-sm/relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
)

CommandInput.displayName = "CommandInput"

export type CommandListProps = React.ComponentProps<typeof CommandPrimitive.List>

const CommandList = ({ className, ...props }: CommandListProps) => (
  <CommandPrimitive.List
    data-slot="command-list"
    className={cn(
      "no-scrollbar max-h-80 scroll-py-1 overflow-x-hidden overflow-y-auto p-2 outline-none",
      className
    )}
    {...props}
  />
)

CommandList.displayName = "CommandList"

export type CommandEmptyProps = React.ComponentProps<typeof CommandPrimitive.Empty>

const CommandEmpty = ({ className, ...props }: CommandEmptyProps) => (
  <CommandPrimitive.Empty
    data-slot="command-empty"
    className={cn("py-6 text-center text-sm/relaxed text-muted-foreground", className)}
    {...props}
  />
)

CommandEmpty.displayName = "CommandEmpty"

export type CommandGroupProps = React.ComponentProps<typeof CommandPrimitive.Group>

const CommandGroup = ({ className, ...props }: CommandGroupProps) => (
  <CommandPrimitive.Group
    data-slot="command-group"
    className={cn(
      "overflow-hidden text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
)

CommandGroup.displayName = "CommandGroup"

export type CommandSeparatorProps = React.ComponentProps<
  typeof CommandPrimitive.Separator
>

const CommandSeparator = ({ className, ...props }: CommandSeparatorProps) => (
  <CommandPrimitive.Separator
    data-slot="command-separator"
    className={cn("-mx-2 my-2 h-px bg-border/70", className)}
    {...props}
  />
)

CommandSeparator.displayName = "CommandSeparator"

export type CommandItemIndicator = "none" | "check" | "current"

export type CommandItemProps = React.ComponentProps<typeof CommandPrimitive.Item> & {
  indicator?: CommandItemIndicator
}

const CommandItem = ({
  className,
  children,
  indicator = "none",
  ...props
}: CommandItemProps) => (
  <CommandPrimitive.Item
    data-slot="command-item"
    className={cn(
      "group/command-item relative flex min-h-7 cursor-default items-center gap-3 rounded-sm px-2.5 py-1.5 text-sm/relaxed font-sans font-normal outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
    {indicator === "check" ? <CheckIcon className="ml-auto" /> : null}
    {indicator === "current" ? (
      <span className="ml-auto text-muted-foreground">current</span>
    ) : null}
  </CommandPrimitive.Item>
)

CommandItem.displayName = "CommandItem"

export type CommandShortcutProps = React.ComponentProps<"span">

const CommandShortcut = ({ className, ...props }: CommandShortcutProps) => (
  <span
    data-slot="command-shortcut"
    className={cn(
      "ml-auto text-xs tracking-wide text-muted-foreground group-data-selected/command-item:text-foreground",
      className
    )}
    {...props}
  />
)

CommandShortcut.displayName = "CommandShortcut"

export default Command

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
}
