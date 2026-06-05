import { createFileRoute } from "@tanstack/react-router";
import { EditorScreen } from "../../components/editor/editorScreen";

export const Route = createFileRoute("/rooms/$shareToken")({
  component: RoomPage,
});

function RoomPage() {
  const { shareToken } = Route.useParams();

  return <EditorScreen shareToken={shareToken} />;
}
