import type { ReactNode } from "react";

interface EditorLayoutProps {
  toolbar: ReactNode;
  children: ReactNode;
}

export function EditorLayout(props: EditorLayoutProps) {
  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] bg-background text-foreground">
      <header className="h-10 border-b bg-muted px-4">{props.toolbar}</header>
      <section className="grid min-h-0 grid-cols-[1fr_auto]">
        <div className="min-h-0">{props.children}</div>
      </section>
    </main>
  );
}
