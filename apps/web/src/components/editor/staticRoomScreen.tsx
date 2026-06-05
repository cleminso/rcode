interface StaticRoomScreenProps {
  staticToken: string;
}

export function StaticRoomScreen(props: StaticRoomScreenProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">Static room {props.staticToken}</p>
    </main>
  );
}
