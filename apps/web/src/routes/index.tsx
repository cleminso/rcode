// It is the first thing users see when visiting the app.
import { createFileRoute } from "@tanstack/react-router";

// Landing page at the root path `/`.
// This is the first thing users see when visiting the app.
export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <h1>rcode</h1>
      <p>Collaborative code editor</p>
    </div>
  );
}
