import type { ReactNode } from "react";

interface EditorLayoutProps {
  toolbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function EditorLayout(props: EditorLayoutProps) {
  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-background text-foreground">
      <header className="flex h-[38px] items-center border-b border-border">
        <div className="flex w-full items-center px-3">
          {props.toolbar}
        </div>
      </header>
      <section className="grid min-h-0 grid-cols-[1fr_auto]">
        <div className="min-h-0">{props.children}</div>
      </section>
      <footer className="flex h-[34px] items-center border-t border-border">
        <div className="flex w-full items-center px-3">
          {props.footer}
        </div>
      </footer>
    </main>
  );
}
