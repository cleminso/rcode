# Debugging Jazz Permissions

## Table of Contents

- [Purpose](#purpose)
- [Issue summary](#issue-summary)
- [Root causes](#root-causes)
- [Debugging process](#debugging-process)
- [Prevention plan](#prevention-plan)
- [Testing strategy](#testing-strategy)

## Purpose

Use this workflow when Jazz writes fail with policy errors, especially after changes to `packages/database/schema/src/schema.ts` or `packages/database/schema/src/permissions.ts`.

## Issue summary

The command menu archive work added nullable archive fields to `rooms` and updated permissions so room metadata and Yjs writes are blocked when a room is archived.

After that change, room creation from `/dashboard` failed with:

```/dev/null/error.txt#L1
Insert failed: WriteError("policy denied INSERT on table roomMetadata")
```

The room still appeared in the dashboard because `rooms` insert succeeded before `roomMetadata` insert failed. Jazz does not automatically roll back earlier successful writes when a later write is denied.

## Root causes

### Nullable fields

The migration added optional fields with `default: null`:

```packages/database/schema/migrations/20260612T090311-addRoomArchiveFields-876176f0c723-9da15ab98cc6.ts#L4-8
  migrate: {
    "rooms": {
      "archivedAt": s.add.timestamp({ default: null }),
      "archivedBySessionUserId": s.add.string({ default: null }),
    },
```

Existing rooms received `archivedAt: null`. UI code originally checked only `archivedAt !== undefined`, so `null` was treated as archived.

Correct application-level archive check:

```/dev/null/archiveCheck.ts#L1
const isArchived = room.archivedAt !== undefined && room.archivedAt !== null;
```

### `undefined` does not mean `is null` in permissions

In Jazz permission where objects, `undefined` filters are ignored. This means:

```/dev/null/permissions.ts#L1-4
policy.rooms.exists.where({
  id: roomId,
  archivedAt: undefined,
})
```

is equivalent to checking only `id: roomId`. It does not mean “room is not archived”.

Use `null` or `{ isNull: true }` for nullable fields.

### Wrong `exists` form for referenced room checks

This form compiled but failed in policy tests for `roomMetadata` insert:

```/dev/null/permissions.ts#L1-4
policy.rooms.exists.where({
  id: metadata.room_id,
  archivedAt: null,
})
```

The verified working form is:

```/dev/null/permissions.ts#L1
policy.exists(policy.rooms.where({ id: metadata.room_id, archivedAt: null }))
```

Use this form when a permission rule needs to check fields on a referenced row.

## Debugging process

1. Confirm the failure surface.
   - Identify the exact table and operation from the error message.
   - Example: `policy denied INSERT on table roomMetadata` means inspect `policy.roomMetadata.allowInsert`.

2. Map the write sequence.
   - For room creation, the app writes:
     1. `rooms`
     2. `roomParticipants`
     3. `roomMetadata`
   - A failure on step 3 leaves step 1 visible unless the app compensates.

3. Read current schema and permissions.
   - Check nullable fields and defaults in `schema.ts` and migration files.
   - Check whether permission predicates use `null`, `undefined`, `exists`, `allowedTo`, or qualified relation filters.

4. Verify Jazz semantics from primary sources.
   - Use Jazz docs for high-level API behavior.
   - Use installed `jazz-tools` source and tests for exact compiler/runtime behavior.
   - Do not assume that similar-looking permission expressions are equivalent.

5. Reproduce with `jazz-tools/testing`.
   - Create a minimal schema and permission set.
   - Test the failing write directly.
   - Test one predicate variant at a time.

6. Apply only the verified permission expression.
   - Re-run schema build.
   - Deploy permissions.
   - Re-run app typecheck/build.

## Prevention plan

- Add permission reproduction tests for policy-dependent flows before changing schema or permissions.
- Test create flows after every schema or permission deployment.
- Do not add nullable permission checks without testing the exact `null`/`undefined` behavior.
- Avoid `undefined` in permission predicates unless the goal is to omit the filter.
- Use `policy.exists(policy.<table>.where(...))` for referenced-row field checks.
- Keep creation flows aware that Jazz writes are not automatically atomic across separate calls.
- Do not render creator-owned rooms as healthy if required child rows such as `roomMetadata` are missing.

## Testing strategy

Use a focused policy test harness with `jazz-tools/testing`.

Test matrix for archive permissions:

| Scenario | Expected result |
| --- | --- |
| Owner inserts metadata for active room | allowed |
| Owner inserts metadata for archived room | denied |
| Participant inserts metadata for active room | allowed |
| Participant inserts metadata for archived room | denied |
| Yjs update insert for active room | allowed |
| Yjs update insert for archived room | denied |

Minimal reproduction shape:

```/dev/null/policy-test.ts#L1-22
const permissions = definePermissions(app, ({ policy, session, allOf, anyOf, allowedTo }) => {
  const canEditSession = anyOf([
    session.where({ authMode: "local-first" }),
    session.where({ authMode: "external" }),
  ]);

  policy.roomMetadata.allowInsert.where((metadata) =>
    allOf([
      { session_user_id: session.user_id },
      canEditSession,
      policy.exists(policy.rooms.where({
        id: metadata.room_id,
        archivedAt: null,
      })),
      anyOf([
        allowedTo.update("room"),
        policy.roomParticipants.exists.where({
          room_id: metadata.room_id,
          session_user_id: session.user_id,
        }),
      ]),
    ]),
  );
});
```

Verification commands:

```/dev/null/commands.sh#L1-4
pnpm --filter ./packages/database/schema build
pnpm jazz:deploy
pnpm --filter ./apps/web typecheck
pnpm --filter ./apps/web build
```

After deployment, manually verify the user flow:

1. Create a room from `/dashboard`.
2. Confirm no `roomMetadata` policy error appears.
3. Confirm the room opens with editable metadata.
4. Archive the room from the command menu.
5. Confirm share/static access is blocked.
6. Unarchive from the dashboard archived section.
7. Confirm editing works again.
