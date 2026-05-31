// Defines the rcode data model, composed alongside auth tables.
import { schema as s } from "jazz-tools";
import { schema as betterauthSchema } from "./better-auth/schema";

const schema = {
  // Compose the Better-Auth schema with app-specific tables.
  ...betterauthSchema,
  rooms: s.table({
    title: s.string(),
  }),
};

type AppSchema = s.Schema<typeof schema>; // extract TypeScript type
export const app: s.App<AppSchema> = s.defineApp(schema); // typed app instance used throughout the codebase
