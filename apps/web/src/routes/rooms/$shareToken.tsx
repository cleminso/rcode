import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rooms/$shareToken")({
  component: RoomPage,
});

function RoomPage() {
  const { shareToken } = Route.useParams();

  return (
    null
  );
}
