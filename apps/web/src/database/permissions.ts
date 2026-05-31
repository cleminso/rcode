// Jazz clients can read/write data they have access to via group membership.
// Better-Auth tables contain sensitive data that must never be accessible from the browser.
// This file explicitly blocks all client access to auth and other sensitive tables.
import { definePermissions } from "jazz-tools";
import { app } from "./schema";

export default definePermissions(app, ({ policy }) => {
  // This file explicitly blocks all client access to auth tables.
  // Application tables (e.g., rooms) are configured with their own policies below.
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

  policy.rooms.allowRead.always();
  policy.rooms.allowInsert.always();
  policy.rooms.allowUpdate.always();
  policy.rooms.allowDelete.always();
});
