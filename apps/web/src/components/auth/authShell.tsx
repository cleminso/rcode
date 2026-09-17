import Button from "@rcode/ui/button";
import { AuthPanel, AuthPanelBody, AuthPanelBreadcrumb } from "@rcode/ui/authPanel";
import { type ReactNode } from "react";
import { LogoButton } from "../layout/logoButton";

interface AuthShellProps {
  activeBreadcrumb?: string;
  children: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  title: string;
  onBreadcrumbBack?: () => void;
}

export function AuthShell({ activeBreadcrumb, children, description, footer, title, onBreadcrumbBack }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-9.5 items-center px-3">
        <LogoButton />
      </header>
      <div className="flex justify-center px-6 pb-10 pt-28">
        <div className="w-full max-w-150">
          <AuthPanelBreadcrumb>
            <span>/</span>
            {activeBreadcrumb === undefined ? (
              <span>{title}</span>
            ) : (
              <Button className="h-auto rounded-none px-0 text-2xl font-medium hover:bg-transparent hover:text-muted-foreground" size="none" variant="ghost" type="button" onClick={onBreadcrumbBack}>
                {title}
              </Button>
            )}
            {activeBreadcrumb !== undefined ? <span>/</span> : null}
            {activeBreadcrumb !== undefined ? <span className="text-foreground">{activeBreadcrumb}</span> : null}
          </AuthPanelBreadcrumb>
          <AuthPanel>
            <AuthPanelBody>
              {description !== undefined ? <p className="font-sans text-base font-normal text-muted-foreground">{description}</p> : null}
              {children}
              {footer !== undefined ? <div className="font-sans text-center text-base font-normal text-muted-foreground">{footer}</div> : null}
            </AuthPanelBody>
          </AuthPanel>
        </div>
      </div>
    </main>
  );
}
