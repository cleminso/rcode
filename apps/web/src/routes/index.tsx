import { Link, createFileRoute } from "@tanstack/react-router";

// Landing page at the root path `/`.
// This is the first thing users see when visiting the app.
export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    null
  );
}
