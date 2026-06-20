// Defines the rcode product data model, composed alongside Better Auth tables.
//
// Use Jazz `session.user_id` as the app-facing identity id across both auth modes:
// 1. local-first users get it from their browser-held Jazz secret
// 2. signed-in users get the same id from the Better Auth JWT `sub` claim
//
// `profiles` stores collaboration identity for rcode UI.
// Identity columns use `session_user_id` because the value comes from Jazz `session.user_id`,
// not from the profile row id and not necessarily from an existing Better Auth user row.
import { schema as s } from "jazz-tools";
import { schema as betterauthSchema } from "./better-auth/schema";

const schema = {
  // Compose the Better-Auth schema with app-specific tables.
  ...betterauthSchema,
  // Product identity for collaboration UI. `session_user_id` is the Jazz
  // session identity, while this table's row id is only the profile row id.
  profiles: s.table({
    session_user_id: s.string(),
    displayName: s.string(),
    avatarFileId: s.ref("files").optional(),
    origin: s.string().default("user-created"),
    setupPromptDismissed: s.boolean().default(true),
  }),
  file_parts: s.table({
    data: s.bytes(),
  }),
  files: s.table({
    name: s.string().optional(),
    mimeType: s.string(),
    partIds: s.array(s.ref("file_parts")),
    partSizes: s.array(s.int()),
  }),
  // Protected room identity, sharing, and ownership fields. Participant-editable
  // display/editor metadata lives in roomMetadata so permissions stay row-level.
  rooms: s.table({
    shareToken: s.string(),
    staticToken: s.string(),
    creator_session_user_id: s.string(),
    archivedAt: s.timestamp().optional(),
    archivedBySessionUserId: s.string().optional(),
  }),
  // Participant-editable room metadata. There should be one row per room by
  // app convention; Jazz does not enforce a unique room_id here.
  roomMetadata: s.table({
    room_id: s.ref("rooms"),
    session_user_id: s.string(),
    title: s.string(),
    editorLanguage: s.string().default("plaintext"),
  }),
  // Per-user product preferences (e.g. editor settings). Stored as JSON so the
  // app can evolve the settings shape without schema migrations.
  userSettings: s.table({
    session_user_id: s.string(),
    editor: s.json().optional(),
  }),
  // Durable joined-room history used by room access and dashboard surfaces.
  roomParticipants: s.table({
    room_id: s.ref("rooms"),
    session_user_id: s.string(),
    lastAccessedAt: s.timestamp(),
  }),
  // Canonical Yjs update log. The provider applies these binary updates to a
  // room-scoped Y.Doc to reconstruct collaborative text content.
  roomYjsUpdates: s.table({
    room_id: s.ref("rooms"),
    update: s.bytes(),
    session_user_id: s.string(),
    y_client_id: s.string(),
    provider_instance_id: s.string(),
    createdAt: s.timestamp(),
  }),
  // Immutable Yjs checkpoints for faster bootstrap and restore workflows.
  roomYjsSnapshots: s.table({
    room_id: s.ref("rooms"),
    state: s.bytes(),
    stateVector: s.bytes().optional(),
    textHash: s.string().optional(),
    session_user_id: s.string().optional(),
    createdAt: s.timestamp(),
  }),
};

type AppSchema = s.Schema<typeof schema>; // extract TypeScript type
export const app: s.App<AppSchema> = s.defineApp(schema); // typed app instance used throughout the codebase
