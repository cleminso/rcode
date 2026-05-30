import { createFileRoute } from "@tanstack/react-router";

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
