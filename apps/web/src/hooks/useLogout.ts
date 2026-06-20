import { useNavigate } from "@tanstack/react-router";
import { useDb, useLocalFirstAuth } from "jazz-tools/react";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { toasts } from "../lib/toasts";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Could not log out.";
}

export function useLogout() {
  const db = useDb();
  const localFirstAuth = useLocalFirstAuth();
  const navigate = useNavigate();
  const { data: authSession } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut === true) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await db.logout();

      if (authSession?.user.email !== undefined) {
        await authClient.signOut();
      } else {
        await localFirstAuth.signOut();
      }

      await navigate({ to: "/" });
    } catch (caughtError) {
      toasts.account.error(getErrorMessage(caughtError));
      setIsLoggingOut(false);
    }
  };

  return { isLoggingOut, logout };
}
