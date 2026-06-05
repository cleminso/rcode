import { AuthButton } from "../auth/authButton";
import { useCreateRoom } from "./useCreateRoom";

export function DashboardScreen() {
  const { canCreate, createRoom, error, isCreating } = useCreateRoom();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <p className="text-sm font-semibold">rcode</p>
        <AuthButton />
      </header>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            type="button"
            disabled={canCreate === false || isCreating === true}
            onClick={() => void createRoom()}
          >
            {isCreating === true ? "Creating..." : "Create room"}
          </button>
        </div>
        {error !== null ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Room grid and creation flow will live here.</p>
        </div>
      </section>
    </main>
  );
}
