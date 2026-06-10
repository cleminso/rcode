# Jazz Schema Workflow

## Table of Contents

- [Purpose](#purpose)
- [Environment](#environment)
- [Commands](#commands)
- [When Schema or Permissions Change](#when-schema-or-permissions-change)
- [Handling Migration Required Errors](#handling-migration-required-errors)
- [Files to Commit](#files-to-commit)
- [Troubleshooting](#troubleshooting)

## Purpose

Jazz schema and permissions changes affect runtime reads and writes. If schema or permissions are changed locally but not deployed, app screens can hang on loading states or writes can fail with policy errors.

## Environment

Use `apps/web/.env` as the source for Jazz deployment variables.

Required variables include:

- `VITE_JAZZ_APP_ID`
- `VITE_JAZZ_SERVER_URL`

Do not create a new Jazz app id for routine schema work.

## Commands

From the workspace root:

- `pnpm jazz:deploy` validates and deploys the current schema and permissions using `apps/web/.env`.
- `pnpm jazz:migrations:create <appId> --fromHash <fromHash> --toHash <toHash>` creates a migration stub.
- `pnpm jazz:migrations:push <appId> <fromHash> <toHash>` pushes a completed migration using `apps/web/.env`.
- `pnpm --filter ./packages/database/schema build` typechecks the schema package.

## When Schema or Permissions Change

If either file changes, run the Jazz workflow before marking the task complete:

- `packages/database/schema/src/schema.ts`
- `packages/database/schema/src/permissions.ts`

Workflow:

1. Run `pnpm --filter ./packages/database/schema build`.
2. Run `pnpm jazz:deploy`.
3. If deploy succeeds, continue with app verification.
4. If deploy reports that a migration is required, follow [Handling Migration Required Errors](#handling-migration-required-errors).
5. Run focused app verification, usually `pnpm --filter ./apps/web typecheck` and any relevant build command.

## Handling Migration Required Errors

When deploy reports a message like:

- `The new permissions schema <toHash> is not connected to the previous permissions schema <fromHash> on the server.`
- `Run jazz-tools migrations create <appId> --fromHash <fromHash> --toHash <toHash>`

Do this:

1. Run the suggested migration create command through the root helper:
   - `pnpm jazz:migrations:create <appId> --fromHash <fromHash> --toHash <toHash>`
2. Rename the generated migration file so `unnamed` becomes a meaningful camelCase description.
3. Inspect the generated migration. Keep only the intended structural changes.
4. Run:
   - `pnpm jazz:migrations:push <appId> <fromHash> <toHash>`
5. Re-run:
   - `pnpm jazz:deploy`

Permission-only changes may not need structural migration contents, but still follow the deploy output. If deploy says the schema hashes are not connected, push the generated migration chain before deploying permissions.

## Files to Commit

Commit schema workflow artifacts with the code that depends on them:

- `packages/database/schema/src/schema.ts`
- `packages/database/schema/src/permissions.ts`
- `packages/database/schema/migrations/*.ts`
- `packages/database/schema/migrations/snapshots/*.json`

Do not commit migrations accidentally generated under an app directory such as `apps/web/migrations`.

## Troubleshooting

If `/dashboard` stays on `Loading rooms.` or room writes fail with `policy denied`, check for a schema/permission deployment mismatch first.

Use this recovery sequence:

1. Run `pnpm jazz:deploy`.
2. If migration is required, create and push it.
3. Re-run `pnpm jazz:deploy`.
4. Restart the local web and API dev servers if they were already running.
