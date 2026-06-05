import { createFileRoute } from "@tanstack/react-router";
import { StaticRoomScreen } from "../../components/editor/staticRoomScreen";

export const Route = createFileRoute("/s/$staticToken")({
  component: StaticRoomPage,
});

function StaticRoomPage() {
  const { staticToken } = Route.useParams();

  return <StaticRoomScreen staticToken={staticToken} />;
}
