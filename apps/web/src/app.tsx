import { JazzProvider } from "jazz-tools/react";

export default function App() {
  return (
    <JazzProvider
      config={{
        appId: import.meta.env.VITE_JAZZ_APP_ID,
        serverUrl: import.meta.env.VITE_JAZZ_SERVER_URL,
      }}
    >
      {null}
    </JazzProvider>
  );
}
