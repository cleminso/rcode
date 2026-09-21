// Defines the rcode product data model, composed alongside Better Auth tables.
//
// Use Jazz `session.user.account` as the app-facing identity id across auth modes.
//
// `profiles` stores collaboration identity for rcode UI.
// Existing `session_user_id` column names are retained, but their values are Jazz account ids,
// not provider subjects or Better Auth user ids.
import { schema as s } from "jazz-tools";
import { schema as betterauthSchema } from "./better-auth/schema";

const schema = {
  // Compose the Better-Auth schema with app-specific tables.
  ...betterauthSchema,
  // Product identity for collaboration UI. `session_user_id` is the Jazz
  // session identity, while this table's row id is only the profile row id.
  profiles: s.table(
    {
      session_user_id: s.uuid(),
      displayName: s.string(),
      avatarFileId: s.uuid().optional(),
      origin: s.string().default("user-created"),
      setupPromptDismissed: s.boolean().default(true),
    },
    {
      avatarFile: s.rel("files", "avatarFileId"),
    },
  ),
  files: s.table(
    {
      name: s.string().optional(),
      mimeType: s.string(),
      size: s.int(),
      data: s.bytes(),
    },
    {
      profilesViaAvatarFile: s.reverse("profiles", "avatarFile"),
    },
  ),
  // Protected room identity, sharing, and ownership fields. Participant-editable
  // display/editor metadata lives in roomMetadata so permissions stay row-level.
  rooms: s.table(
    {
      shareToken: s.string(),
      staticToken: s.string(),
      creator_session_user_id: s.uuid(),
      archivedAt: s.timestamp().optional(),
      archivedBySessionUserId: s.uuid().optional(),
    },
    {
      roomMetadataViaRoom: s.reverse("roomMetadata", "room"),
      roomParticipantsViaRoom: s.reverse("roomParticipants", "room"),
      roomYjsUpdatesViaRoom: s.reverse("roomYjsUpdates", "room"),
      roomYjsSnapshotsViaRoom: s.reverse("roomYjsSnapshots", "room"),
    },
  ),
  // Participant-editable room metadata. There should be one row per room by
  // app convention; Jazz does not enforce a unique room_id here.
  roomMetadata: s.table(
    {
      room_id: s.uuid(),
      session_user_id: s.uuid(),
      title: s.string(),
      editorLanguage: s.string().default("plaintext"),
    },
    {
      room: s.rel("rooms", "room_id"),
    },
  ),
  // Per-user product preferences (e.g. editor settings). Stored as JSON so the
  // app can evolve the settings shape without schema migrations.
  userSettings: s.table(
    {
      session_user_id: s.uuid(),
      editor: s.json().optional(),
    },
    {},
  ),
  // Durable joined-room history used by room access and dashboard surfaces.
  roomParticipants: s.table(
    {
      room_id: s.uuid(),
      session_user_id: s.uuid(),
      lastAccessedAt: s.timestamp(),
    },
    {
      room: s.rel("rooms", "room_id"),
    },
  ),
  // Canonical Yjs update log. The provider applies these binary updates to a
  // room-scoped Y.Doc to reconstruct collaborative text content.
  roomYjsUpdates: s.table(
    {
      room_id: s.uuid(),
      update: s.bytes(),
      session_user_id: s.uuid(),
      y_client_id: s.string(),
      provider_instance_id: s.string(),
      createdAt: s.allowExternalProvenanceName(s.timestamp()),
    },
    {
      room: s.rel("rooms", "room_id"),
    },
  ),
  // Immutable Yjs checkpoints for faster bootstrap and restore workflows.
  roomYjsSnapshots: s.table(
    {
      room_id: s.uuid(),
      state: s.bytes(),
      stateVector: s.bytes().optional(),
      textHash: s.string().optional(),
      session_user_id: s.uuid().optional(),
      createdAt: s.allowExternalProvenanceName(s.timestamp()),
    },
    {
      room: s.rel("rooms", "room_id"),
    },
  ),
};

type AppSchema = s.Schema<typeof schema>; // extract TypeScript type
export const app: s.App<AppSchema> = s.defineApp(schema); // typed app instance used throughout the codebase
