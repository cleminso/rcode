import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$shareToken")({
  component: ShortLinkRedirect,
});

function ShortLinkRedirect() {
  const { shareToken } = Route.useParams();

  return <Navigate params={{ shareToken }} replace to="/rooms/$shareToken" />;
}
