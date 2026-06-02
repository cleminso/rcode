import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$staticToken")({
  component: StaticRoomPage,
});

function StaticRoomPage() {
  const { staticToken } = Route.useParams();

  return (
    null
  );
}
