import { cn } from "@/lib/utils"

export type AuthPanelProps = React.ComponentProps<"section">
export type AuthPanelHeaderProps = React.ComponentProps<"div">
export type AuthPanelBreadcrumbProps = React.ComponentProps<"div">
export type AuthPanelBodyProps = React.ComponentProps<"div">
export type AuthPanelMessageProps = React.ComponentProps<"p"> & {
  variant?: "error" | "info"
}

function AuthPanel({ className, ...props }: AuthPanelProps) {
  return <section className={cn("w-full max-w-[600px] border border-border bg-card p-9 text-foreground", className)} {...props} />
}

function AuthPanelHeader({ className, ...props }: AuthPanelHeaderProps) {
  return <div className={cn("pb-1.5 flex items-center gap-1 font-mono text-sm uppercase", className)} {...props} />
}

function AuthPanelBreadcrumb({ className, ...props }: AuthPanelBreadcrumbProps) {
  return <div className={cn("pb-1.5 flex items-center gap-1 font-mono text-sm uppercase", className)} {...props} />
}

function AuthPanelBody({ className, ...props }: AuthPanelBodyProps) {
  return <div className={cn("flex flex-col gap-5", className)} {...props} />
}

function AuthPanelMessage({ className, variant = "info", ...props }: AuthPanelMessageProps) {
  return (
    <p
      className={cn(
        "border px-3 py-2 font-mono text-xs leading-5",
        variant === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

AuthPanel.displayName = "AuthPanel"
AuthPanelHeader.displayName = "AuthPanelHeader"
AuthPanelBreadcrumb.displayName = "AuthPanelBreadcrumb"
AuthPanelBody.displayName = "AuthPanelBody"
AuthPanelMessage.displayName = "AuthPanelMessage"

export { AuthPanel, AuthPanelBody, AuthPanelBreadcrumb, AuthPanelHeader, AuthPanelMessage }

export default AuthPanel
