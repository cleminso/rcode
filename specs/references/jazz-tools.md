Jazz is a local-first relational database built around a table-first storage engine.

The easiest way to picture the runtime is:

- application code talks about tables, rows, filters, and subscriptions
- the engine stores those rows in raw tables
- every stored row is one flat row*format record with reserved *\_jazz\* columns plus the application columns
- current reads come from compact visible entries
- history, replay, sync, and durability all speak the same row-batch language
