import { app } from "@rcode/schema";
import { useNavigate } from "@tanstack/react-router";
import { useDb, useSession } from "jazz-tools/react";
import { useState } from "react";
import { newRoomToken } from "../lib/generate";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Could not create room.";
}

export function useCreateRoom() {
  const db = useDb();
  const session = useSession();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate =
    session !== null &&
    (session.authMode === "local-first" || session.authMode === "external");

  const createRoom = async () => {
    if (canCreate === false) {
      setError("Creating a room requires an editable Jazz identity.");
      return;
    }

    if (session === null) {
      setError("Creating a room requires an active Jazz identity.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const shareToken = newRoomToken();
      const staticToken = newRoomToken();

      const roomWrite = db.insert(app.rooms, {
        shareToken,
        staticToken,
        creator_session_user_id: session.user_id,
        archivedAt: null,
        archivedBySessionUserId: null,
      });
      const room = roomWrite.value;

      await roomWrite.wait({ tier: "edge" });

      const participantWrite = db.insert(app.roomParticipants, {
        room_id: room.id,
        session_user_id: session.user_id,
        lastAccessedAt: new Date(),
      });

      await participantWrite.wait({ tier: "edge" });

      await db.insert(app.roomMetadata, {
        room_id: room.id,
        session_user_id: session.user_id,
        title: "",
        editorLanguage: "plaintext",
      }).wait({ tier: "edge" });

      await navigate({
        to: "/rooms/$shareToken",
        params: { shareToken },
      });

      return room;
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
      return;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    canCreate,
    createRoom,
    error,
    isCreating,
  };
}
