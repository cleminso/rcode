## Problem Statement

A web editor that quickly shares links needs low-friction entry. Is not acceptable that collaborator must create an account before viewing or start editing. But collaboration still needs identity for cursors, avatars and permissions.

## Solution

[Jazz Auth Modes](https://jazz.tools/docs/auth/authentication#jazz-framework-react)

Support `read-only` user session through Jazz `anonymous`.

- who is viewing the room?
- get generated names and colors.

Support `guest-editing` user session through Jazz `local-first` mode.

- can opens rcode, creates a room, edits and shares code, without signed up
- start editing without signing up - get generated names and colors
- can later upgrade to become registered users while keeping their identity

Support `signed-in` user session through Jazz `external` mode.

- create/has a Better Auth account (name; picture)
- wants persistent identity across devices.
- can create multiple rooms, CRUD actions

This is a lightweight approach that avoid implementing a full ownership and role-based concept.

## Users Flow

As a read-only user, I:

- open a link shared from a friend
- view the room content but I can't edit it

As a guest user, I:

- get a stable identity stored inside my browser `localStorage`
  - if I clean the `localStorage`, I lose my identity
- can create many rooms, edit and share code without signing up
- can save my account secret securely, then reuse it to login across devices
  - that I fully own my account identity, that is not tied to any external account provider
- can become a signed-in user while keeping my identity
  - that I don't have to mind about saving my account secret
  - that I can use it across devices
  - but my account credentials are owned by the rcode server

As a signed-in user, I can:

- create, edit and share rooms
- manage my account (updating my profile and deleting my account), and manage my rooms (create, edit, delete)
