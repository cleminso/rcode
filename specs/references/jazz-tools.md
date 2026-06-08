# Table of Contents

- [Overview](#overview)
- [Runtime Model](#runtime-model)

## Overview

Jazz is a local-first relational database built around a table-first storage engine.

## Runtime Model

The easiest way to picture the runtime is:

- application code talks about tables, rows, filters, and subscriptions
- the engine stores those rows in raw tables
- every stored row is one flat row-format record with reserved `_jazz` columns plus the application columns
- reads come from compact visible entries
- history, replay, sync, and durability all speak the same row-batch language

## How sync Works

New clients do NOT download all historical row versions:

> When your app subscribes to a query, Jazz sends that query subscription upstream. The server evaluates the query against its own current relational state, finds the matching rows, and sends them back.

The sync protocol sends visible state downstream, not version history:

> "clients update their local replicas from deltas instead of from full snapshots every time"

This means a new client subscribing to a table will receive the current matching visible rows, not every historical version of those rows.

[How Sync Works](https://jazz.tools/docs/concepts/how-sync-works)

## Query Performance

`useAll` materializes the full result set into memory as an array. There is no automatic pagination, streaming, or memory guard:

> "`useAll(query)` — Returns `T[] | undefined`"
> "There is no documented automatic chunking, virtual scrolling, or memory guard for unbounded queries."

[Queries docs](https://jazz.tools/docs/reading/queries)
[Advanced Internals](https://jazz.tools/docs/reference/internals)

## Deletion and Pruning

Soft delete only. Hard delete exists internally but is not exposed to apps:

> "A hard delete mode also exists at the storage layer, but it is not currently exposed as the normal app-facing API."

Soft-deleted rows do NOT sync to new clients:

> "Soft-deleted rows leave the live \_id index and do not appear in ordinary live queries / subscriptions."

But old versions are kept forever:

> "There is a low-level truncation path that can drop older ancestry while preserving the current visible state, but it is not a normal application-facing feature yet."

[Advanced Internals](https://jazz.tools/docs/reference/internals)
