import { cn } from "@/lib/utils"

export type AuthTabValue = "email" | "passphrase"

export interface AuthTabsProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value: AuthTabValue
  onChange: (value: AuthTabValue) => void
}

const authTabs = [
  { value: "email", label: "/ EMAIL" },
  { value: "passphrase", label: "/ PASSPHRASE" },
] satisfies Array<{ value: AuthTabValue; label: string }>

function AuthTabs({ className, value, onChange, ...props }: AuthTabsProps) {
  return (
    <div className={cn("flex w-full gap-1 bg-muted/20 p-1 rounded-xs", className)} {...props}>
      {authTabs.map((tab) => (
        <button
          className={cn(
            "h-8 flex-1 bg-muted/20 font-mono text-sm uppercase rounded-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none",
            value === tab.value ? "bg-muted text-foreground" : "bg-muted/20",
          )}
          key={tab.value}
          data-auth-tab-trigger="true"
          type="button"
          aria-pressed={value === tab.value}
          onClick={() => {
            if (value !== tab.value) {
              onChange(tab.value)
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

AuthTabs.displayName = "AuthTabs"

export { AuthTabs }

export default AuthTabs
