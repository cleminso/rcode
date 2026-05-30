## Problem Statement

A collaborative editor needs every participant to converge on the same text state across devices, reloads, offline editing.

Without sync infrastructure:

- User A types locally.
- User B never receives the updates.
- Reloading loses unsaved content.
- Offline edits conflicts with remove edits.
- A server restart can orphan active sessions.

## Solution

Use Jazz-tools as Yjs sync server.

Frontend:

Backend:

## How Jazz solve offline/reconnect
