import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useRcodeJazzAuth } from "../lib/jazzAuth";
import { getErrorMessage } from "../lib/errors";
import { toasts } from "../lib/toasts";

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
      toasts.account.error(getErrorMessage(caughtError, "Could not log out."));
      setIsLoggingOut(false);
    }
  };

  return { isLoggingOut, logout };
}
