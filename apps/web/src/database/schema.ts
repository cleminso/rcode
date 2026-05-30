import { schema as s } from "jazz-tools";
import { schema as betterauthSchema } from "./better-auth/schema";

const schema = {
  ...betterauthSchema,
  rooms: s.table({
    title: s.string(),
  }),
};

type AppSchema = s.Schema<typeof schema>;
export const app: s.App<AppSchema> = s.defineApp(schema);
