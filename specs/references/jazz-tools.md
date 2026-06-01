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
