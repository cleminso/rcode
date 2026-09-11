import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useRcodeJazzAuth } from "../lib/jazzAuth";
import { toasts } from "../lib/toasts";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Could not log out.";
}

export function useLogout() {
  const jazzAuth = useRcodeJazzAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut === true) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await jazzAuth.logout();
      await navigate({ to: "/" });
    } catch (caughtError) {
      toasts.account.error(getErrorMessage(caughtError));
      setIsLoggingOut(false);
    }
  };

  return { isLoggingOut, logout };
}
