import { Button } from "@rcode/ui/ui/button";
import { type ReactNode } from "react";

export type AuthMethod = "email" | "passphrase";

interface AuthShellProps {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  method: AuthMethod;
  title: string;
  onMethodChange: (method: AuthMethod) => void;
}

export function AuthShell({ children, description, footer, method, title, onMethodChange }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <section className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">rcode</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-md border bg-muted/30 p-1 text-sm">
          <Button
            className="h-9"
            variant={method === "email" ? "secondary" : "ghost"}
            type="button"
            onClick={() => onMethodChange("email")}
          >
            Email
          </Button>
          <Button
            className="h-9"
            variant={method === "passphrase" ? "secondary" : "ghost"}
            type="button"
            onClick={() => onMethodChange("passphrase")}
          >
            Passphrase
          </Button>
        </div>

        <div className="mt-6">{children}</div>
        <div className="mt-8 text-center text-sm">{footer}</div>
      </section>
    </main>
  );
}
