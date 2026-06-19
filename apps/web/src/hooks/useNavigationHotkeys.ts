import { useHotkeys } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";

interface UseNavigationHotkeysOptions {
  account?: boolean;
  createRoom?: {
    enabled: boolean;
    onCreate: () => void;
  };
  dashboard?: boolean;
  signIn?: boolean;
  signUp?: boolean;
}

export function useNavigationHotkeys(options: UseNavigationHotkeysOptions) {
  const navigate = useNavigate();

  useHotkeys([
    {
      hotkey: "D",
      callback: () => {
        void navigate({ to: "/dashboard" });
      },
      options: {
        enabled: options.dashboard === true,
        meta: { name: "Open dashboard" },
      },
    },
    {
      hotkey: "I",
      callback: () => {
        void navigate({ to: "/sign-in" });
      },
      options: {
        enabled: options.signIn === true,
        meta: { name: "Sign in" },
      },
    },
    {
      hotkey: "U",
      callback: () => {
        void navigate({ to: "/sign-up" });
      },
      options: {
        enabled: options.signUp === true,
        meta: { name: "Sign up" },
      },
    },
    {
      hotkey: "A",
      callback: () => {
        void navigate({ to: "/account" });
      },
      options: {
        enabled: options.account === true,
        meta: { name: "Open account" },
      },
    },
    {
      hotkey: "C",
      callback: () => {
        options.createRoom?.onCreate();
      },
      options: {
        enabled: options.createRoom?.enabled === true,
        meta: { name: "Create room" },
      },
    },
  ]);
}
