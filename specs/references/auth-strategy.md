## Problem Statement

A web editor that quickly shares links needs low-friction entry. Is not acceptable that collaborator must create an account before viewing or start editing. But collaboration still needs identity for cursors, avatars and permissions.

## Solution

[Jazz Auth Modes](https://jazz.tools/docs/auth/authentication#jazz-framework-react)

Support `read-only` user session through Jazz `anonymous`.

- who is viewing the room?
- get generated names and colors.

Support `guest-editing` user session through Jazz `local-first` mode.

- users start editing without signing up - get generated names and colors
- users can later upgrade to become registered users while keeping their identity

Support `registered` user session through Jazz `external` mode.

- create a real user accounts (name; picture)
- users can create rooms, CRUD actions

This is a lightweight approach that avoid implementing a full ownership and role-based concept.
