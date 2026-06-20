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
      const participantWrite = db.insert(app.roomParticipants, {
        room_id: room.id,
        session_user_id: session.user_id,
        lastAccessedAt: new Date(),
      });

      await Promise.all([roomWrite.wait({ tier: "local" }), participantWrite.wait({ tier: "local" })]);

      // Metadata permissions depend on the room access path being accepted by
      // the edge, so create it after sync without blocking route navigation
      void Promise.all([roomWrite.wait({ tier: "edge" }), participantWrite.wait({ tier: "edge" })])
        .then(() =>
          db
            .insert(app.roomMetadata, {
              room_id: room.id,
              session_user_id: session.user_id,
              title: "",
              editorLanguage: "plaintext",
            })
            .wait({ tier: "edge" }),
        )
        .catch((caughtError: unknown) => {
          console.error("Failed to sync created room.", caughtError);
        });

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
