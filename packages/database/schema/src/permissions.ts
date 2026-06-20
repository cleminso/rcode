// Permissions are row-level gates evaluated against the active Jazz session.
// Once a compiled permission bundle is loaded, every table operation needs an explicit policy.
// Reads that fail are filtered out; writes that fail are rejected.
import { definePermissions, type RowRefValue } from "jazz-tools";
import { app } from "./schema";

export default definePermissions(app, ({ policy, session, allOf, anyOf, allowedTo }) => {
  const canEditSession = anyOf([
    session.where({ authMode: "local-first" }),
    session.where({ authMode: "external" }),
  ]);

  // A row tied to a room is writable only while the room is still active (not
  // archived) and the session holds editor access to it: a relationship-based
  // room grant, room creatorship, or a participant row. Shared by the metadata,
  // Yjs update, and snapshot rules.
  const roomEditorAccess = (roomId: RowRefValue) =>
    allOf([
      policy.exists(policy.rooms.where({ id: roomId, archivedAt: null })),
      anyOf([
        allowedTo.update("room"),
        policy.rooms.exists.where({
          id: roomId,
          creator_session_user_id: session.user_id,
        }),
        policy.roomParticipants.exists.where({
          room_id: roomId,
          session_user_id: session.user_id,
        }),
      ]),
    ]);

  // Archived rooms keep their content readable only by the creator. Active rooms
  // remain readable by anyone holding a share or static token.
  const roomReadAccess = (roomId: RowRefValue) =>
    anyOf([
      policy.rooms.exists.where({ id: roomId, archivedAt: null }),
      policy.rooms.exists.where({
        id: roomId,
        creator_session_user_id: session.user_id,
      }),
    ]);

  // Better Auth owns account infrastructure. Browser clients should not query or mutate
  // credentials, sessions, linked accounts, verification codes, or JWT signing keys.
  policy.better_auth_user.allowRead.never();
  policy.better_auth_user.allowInsert.never();
  policy.better_auth_user.allowUpdate.never();
  policy.better_auth_user.allowDelete.never();

  policy.better_auth_session.allowRead.never();
  policy.better_auth_session.allowInsert.never();
  policy.better_auth_session.allowUpdate.never();
  policy.better_auth_session.allowDelete.never();

  policy.better_auth_account.allowRead.never();
  policy.better_auth_account.allowInsert.never();
  policy.better_auth_account.allowUpdate.never();
  policy.better_auth_account.allowDelete.never();

  policy.better_auth_verification.allowRead.never();
  policy.better_auth_verification.allowInsert.never();
  policy.better_auth_verification.allowUpdate.never();
  policy.better_auth_verification.allowDelete.never();

  policy.better_auth_jwks.allowRead.never();
  policy.better_auth_jwks.allowInsert.never();
  policy.better_auth_jwks.allowUpdate.never();
  policy.better_auth_jwks.allowDelete.never();

  // Profiles are public to render collaborators, but only the matching Jazz
  // session can create or mutate its own profile row. The new-row check also
  // prevents a client from changing `session_user_id` during an update.
  policy.profiles.allowRead.always();
  policy.profiles.allowInsert.where(
    allOf([{ session_user_id: session.user_id }, canEditSession]),
  );
  policy.profiles.allowUpdate
    .whereOld({ session_user_id: session.user_id })
    .whereNew(allOf([{ session_user_id: session.user_id }, canEditSession]));
  policy.profiles.allowDelete.never();

  // Avatar files are created before a profile points at them, so inserts are
  // direct for authenticated sessions. Reads inherit from the public profile row.
  policy.files.allowRead.where(allowedTo.readReferencing(policy.profiles, "avatarFileId"));
  policy.files.allowInsert.where(canEditSession);
  policy.files.allowUpdate.never();
  policy.files.allowDelete.never();

  policy.file_parts.allowRead.where(allowedTo.readReferencing(policy.files, "partIds"));
  policy.file_parts.allowInsert.where(canEditSession);
  policy.file_parts.allowUpdate.never();
  policy.file_parts.allowDelete.never();

  // Rooms carry protected ownership and sharing fields, so creates/updates/deletes
  // are creator-scoped. Anonymous sessions can read rooms but cannot create them.
  policy.rooms.allowRead.always();
  policy.rooms.allowInsert.where(
    allOf([{ creator_session_user_id: session.user_id }, canEditSession]),
  );
  policy.rooms.allowUpdate
    .whereOld({ creator_session_user_id: session.user_id })
    .whereNew(
      allOf([{ creator_session_user_id: session.user_id }, canEditSession]),
    );
  policy.rooms.allowDelete.where({
    creator_session_user_id: session.user_id,
  });

  // Room metadata is split from protected room fields because collaborators can
  // edit title/language without getting access to tokens or ownership fields.
  // `allowedTo.update("room")` preserves Jazz relationship-based room writes;
  // participant rows preserve share-token collaborator writes.
  policy.roomMetadata.allowRead.where((metadata) => roomReadAccess(metadata.room_id));
  policy.roomMetadata.allowInsert.where((metadata) =>
    allOf([
      { session_user_id: session.user_id },
      canEditSession,
      roomEditorAccess(metadata.room_id),
    ]),
  );
  policy.roomMetadata.allowUpdate.where((metadata) =>
    allOf([canEditSession, roomEditorAccess(metadata.room_id)]),
  );
  policy.roomMetadata.allowDelete.never();

  // Deletion is blocked so leaving/hiding can become an explicit product state
  // instead of erasing access history.
  policy.roomParticipants.allowRead.always();
  policy.roomParticipants.allowInsert.where(
    allOf([{ session_user_id: session.user_id }, canEditSession]),
  );
  policy.roomParticipants.allowUpdate
    .whereOld({ session_user_id: session.user_id })
    .whereNew(allOf([{ session_user_id: session.user_id }, canEditSession]));
  policy.roomParticipants.allowDelete.never();

  // User settings are private. Only the matching session can read or mutate its own row.
  policy.userSettings.allowRead.where({ session_user_id: session.user_id });
  policy.userSettings.allowInsert.where({ session_user_id: session.user_id });
  policy.userSettings.allowUpdate
    .whereOld({ session_user_id: session.user_id })
    .whereNew({ session_user_id: session.user_id });
  policy.userSettings.allowDelete.where({ session_user_id: session.user_id });

  // Yjs update rows are append-only so document reconstruction stays auditable
  // and consistent across clients. Write access mirrors metadata: creator,
  // relationship-based room editor, or durable room participant.
  policy.roomYjsUpdates.allowRead.where((update) => roomReadAccess(update.room_id));
  policy.roomYjsUpdates.allowInsert.where((update) =>
    allOf([
      { session_user_id: session.user_id },
      canEditSession,
      roomEditorAccess(update.room_id),
    ]),
  );
  policy.roomYjsUpdates.allowUpdate.never();
  policy.roomYjsUpdates.allowDelete.never();

  // Snapshots are checkpoint rows. Corrections should be inserted as another
  // snapshot instead of mutating an existing checkpoint. Insert permissions
  // mirror update rows so any authorized editor can write a checkpoint.
  policy.roomYjsSnapshots.allowRead.where((snapshot) => roomReadAccess(snapshot.room_id));
  policy.roomYjsSnapshots.allowInsert.where((snapshot) =>
    allOf([
      { session_user_id: session.user_id },
      canEditSession,
      roomEditorAccess(snapshot.room_id),
    ]),
  );
  policy.roomYjsSnapshots.allowUpdate.never();
  policy.roomYjsSnapshots.allowDelete.never();
});
