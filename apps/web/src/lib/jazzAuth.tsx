import { exportLocalFirstSecret } from "jazz-tools";
import { JazzProvider, useJazzAuth } from "jazz-tools/react";
import { type ReactNode, useMemo } from "react";

export const isEmailAuthEnabled: boolean = false;
export const emailAuthUnavailable = "Email authentication is unavailable.";

function SignedOutJazz() {
  const { sessionActions } = useJazzAuth();

  return (
    <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">
      <button
        type="button"
        onClick={() => {
          void sessionActions.createLocalFirst().catch((error: unknown) => {
            console.error("Failed to create a local identity.", error);
          });
        }}
      >
        Continue locally
      </button>
    </div>
  );
}

export function RcodeJazzProvider({ children }: { children: ReactNode }) {
  return (
    <JazzProvider
      appId={import.meta.env.VITE_JAZZ_APP_ID}
      serverUrl={import.meta.env.VITE_JAZZ_SERVER_URL}
      initial="local-first"
      signedOut={<SignedOutJazz />}
      loading={<div role="status" className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading Jazz…</div>}
      error={(state) => (
        <div role="alert" className="min-h-screen bg-background p-6 text-sm text-destructive">
          <p>{state.error?.message ?? "Could not load Jazz."}</p>
          <button
            type="button"
            onClick={() => {
              void state.retry().catch((retryError: unknown) => {
                console.error("Failed to retry Jazz initialization.", retryError);
              });
            }}
          >
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </JazzProvider>
  );
}

export function useRcodeJazzAuth() {
  const { account, sessionActions } = useJazzAuth();

  return useMemo(() => ({
    getRecoverySecret: () => {
      if (account === undefined) {
        return null;
      }

      try {
        return exportLocalFirstSecret(account);
      } catch {
        return null;
      }
    },
    logout: async () => {
      await sessionActions.logout();
      await sessionActions.createLocalFirst();
    },
    restoreLocalFirst: (secret: string) => sessionActions.restoreLocalFirst(secret),
    withProviderAccount: async (_mode: "link" | "login", _authenticate: () => Promise<void>) => {
      throw new Error(emailAuthUnavailable);
    },
  }), [account, sessionActions]);
}
