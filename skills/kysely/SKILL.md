---
name: kysely
description: Work with Kysely queries, database types, transactions, and migrations. Use when changing an existing Kysely data layer or schema; follow the project's database and migration conventions.
---

# Kysely

Read the existing database factory, schema types, migration runner, and nearby queries before changing the data layer. Reuse the project's client, dialect, and scripts; do not introduce an ORM, code generator, or generic repository layer.

## Types and queries

- Keep table types aligned with the schema in the same change. Follow the project's handwritten or generated-type workflow; do not assume types are generated.
- Use `Generated`, `ColumnType`, `Selectable`, `Insertable`, and `Updateable` when they express the actual select/insert/update contract. Types describe driver values; they do not convert or validate them at runtime. Check dates, numeric/bigint values, JSON, and nullability against the configured driver.
- Follow existing naming and timestamp conventions. Kysely does not automatically update timestamp columns or generate IDs unless the database or application does so.
- Prefer the query builder and parameterized `sql` tagged templates. Never interpolate untrusted values into `sql.raw()` or unchecked dynamic identifiers.
- Distinguish an expected missing row from an invariant failure when choosing `executeTakeFirst()` or `executeTakeFirstOrThrow()`. Use database constraints and the dialect's conflict handling for concurrent writes rather than check-then-insert alone.

## Transactions

Pass the supplied transaction handle through all operations that must commit together. Calling the root client inside the callback runs outside that transaction. Preserve existing locking boundaries and include downstream job writes in the transaction when the project supports it.

Reuse the application-owned pool. A short-lived script should close the client it creates; a request helper should not destroy the shared application client.

## Migrations

- Add migrations using the existing ordered naming convention, with `up` / `down` matching nearby files. Preserve applied migrations; do not reset a database or rewrite migration history to make a change pass.
- Keep migrations independent of current application models and helpers. For schema-only migrations, follow the project's schema-independent database type (for example `Kysely<unknown>`); data migrations can define their historical types locally.
- Use the existing runner and deployment scripts. Kysely's migrator returns `error` / `results`; a resolved promise alone does not mean success. Preserve any project-specific startup locking rather than assuming it is redundant with the migrator's own lock.
- Verify schema changes on a disposable database using the project's checks. Test rollback/reapply when reversibility matters; a `down` migration cannot restore deleted data. Keep one-time ORM migration handovers out of routine application code.

Docs: [Migrations](https://kysely.dev/docs/migrations) · [Driver data types](https://kysely.dev/docs/recipes/data-types) · [Transactions](https://kysely.dev/docs/examples/transactions/simple-transaction).
