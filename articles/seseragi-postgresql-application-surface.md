---
title: "Somehow My Programming Language Roadmap Has PostgreSQL on It"
published: false
tags: programming, database, postgres, seseragi
description: "I am not writing the PostgreSQL protocol. I am trying to decide what database access should mean at the Seseragi application boundary."
series:
main_image:
canonical_url:
---

At some point I looked at the Seseragi roadmap and found PostgreSQL on it.

The browser counter had already made the project feel slightly absurd.

Now the language wants to talk to a database too.

**Apparently I am trying to use my own programming language to access PostgreSQL.**

The reassuring part is that this does not mean writing a database driver from scratch.

Once again, the interesting problem is the boundary between an existing host implementation and the source-language API.

## The Provider side already has useful machinery

Seseragi has been building a Provider boundary for external I/O.

There is already validated PostgreSQL provider work around:

- pools
- queries
- cursors
- resources
- an external driver

So the next step is not:

```text
implement PostgreSQL wire protocol
```

It is:

```text
reuse the existing provider/driver path
↓
design a PostgreSQL-specific application API
```

That work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/322

Issue #322 is still open as of this draft.

The distinction is important because "self-made language" does not imply "self-made TCP stack, TLS stack, and database protocol."

I want to own the programming model.

I am very happy to borrow the execution engine.

## Go and PHP made a universal database API feel like the obvious first answer

Go has `database/sql`.

PHP has PDO.

Both are useful partly because application code can interact with several database drivers through a broadly common surface.

After years of Web development, this instinct is strong:

```text
connection
query
transaction
rows
```

Looks generic enough. Why not make:

```text
Database
```

a standard abstraction and put PostgreSQL, SQLite, and everything else under it?

I stopped myself before doing that.

## I do not want to invent a universal `Database` before I understand the concrete ones

PostgreSQL and SQLite both speak SQL-like languages.

They still differ in:

- dialect
- value types
- transaction behavior/details
- extensions
- concurrency model
- connection architecture
- capabilities

A common abstraction may eventually be useful.

But if I design it before working through the concrete semantics, I am guessing which differences will matter.

#322 therefore deliberately targets a PostgreSQL-specific package rather than creating a universal database API.

SQLite has separate work.

The common layer can emerge later if real duplication proves there is one.

This is almost the reverse of the generic instinct I often like in type classes.

Sometimes abstraction should come first because the same operation is already obvious.

Sometimes the domain differences are the information and premature unification would erase them.

## TypeScript and Python make per-database/library surfaces feel normal too

In TypeScript, application code may use `node-postgres`, Prisma, Drizzle, an ORM, or something else entirely.

Python has broad DB API conventions, but real applications also depend heavily on concrete drivers and ORMs.

There is no single obvious level at which "database" must be standardized.

For Seseragi, the current question is narrower:

**How does a PostgreSQL external service participate in Effect, Provider, resource lifetime, typed failure, and ordinary application code?**

An ORM is a later layer.

A query builder is a later layer.

Migrations are a later layer.

Getting the I/O boundary right is already enough work.

## Parameter binding should be boring and safe

One tempting language-design move is to invent nice SQL interpolation syntax immediately:

```text
query `SELECT * FROM users WHERE id = ${id}`
```

That looks great.

It can also become dangerously ambiguous if it is not crystal clear whether `${id}` means safe parameter binding or literal string interpolation.

The initial PostgreSQL surface therefore makes parameterized query behavior explicit and delegates actual binding to the provider/host driver.

I do not want a pretty new syntax to take us backward from a safety rule application developers already know:

**Values do not get concatenated into SQL text.**

Convenience syntax can come after the semantic contract is solid.

## Row decoding is where the language type system becomes interesting

A query returns rows.

Application code often wants domain values:

```rust
User
Order
Project
```

So eventually the question is:

```text
PostgreSQL row
↓
typed Seseragi value
```

At first this looks similar to JSON decoding.

Both involve named fields and typed data.

That similarity is dangerous if it encourages me to reuse the entire JSON wire model blindly.

PostgreSQL has its own concepts:

- NULL
- numeric types
- timestamps
- arrays
- database-specific values
- column naming/metadata

A DB row and a JSON object can have similar shapes without having the same serialization semantics.

#322 explicitly says typed row decoding should not simply reuse JSON decoding as if they were the same wire format.

**Similar structure is not always shared meaning.**

That sentence keeps showing up in Seseragi design.

## Deriving would be convenient, but I do not want it to erase the boundary

It would be nice to write a nominal Struct and derive whatever evidence is needed to decode it from a row.

Rust's Serde ecosystem makes this kind of experience very attractive.

Seseragi already has deriving work for Show/Debug and planned JSON codecs.

The temptation is to create one giant "decode structured stuff" abstraction and make every external representation use it.

I am resisting that for now.

JSON decoding and PostgreSQL row decoding can share compiler infrastructure later if the commonality is real.

Their public contracts should not become identical just because both eventually create a Struct.

## Transactions immediately turn database access into resource semantics

A database package is not only a collection of query functions.

A transaction has a lifetime:

```text
begin
↓
application work
↓
commit on success
or rollback on failure/cancellation
```

Connections and cursors have lifetimes too.

So Effect/resource scope starts mattering very quickly.

If an HTTP server handler starts a transaction and the request is cancelled, what happens?

If application code fails with a typed error, does rollback still happen?

If the provider fails, who releases the connection?

These are exactly the kinds of problems the earlier Effect/resource architecture was supposed to make composable.

A database makes that architecture stop feeling speculative.

## The HTTP server and PostgreSQL roadmaps meet naturally

The server handler direction is:

```text
Request -> Effect<R, E, Response>
```

Now imagine `R` contains a PostgreSQL capability/provider.

The handler can:

```text
request
↓
DB query / transaction Effect
↓
result
↓
response
```

without the HTTP server inventing a database integration model.

The pieces meet through the general Effect environment/resource semantics.

This is the kind of composition I was hoping for when I chose not to put every I/O feature into its own framework-shaped API.

## Cursor support brings us back to Stream again

Large result sets should not require loading every row into memory before the application sees one.

That means cursor/streaming consumption.

And, inevitably, the roadmap circles back to:

```text
Stream<R, E, Row>
```

#322 explicitly leaves the cursor-to-Stream adapter waiting on the generic Stream core in #313.

HTTP streaming needs Stream.

WebSocket receive needs Stream.

Database cursors need Stream.

At some point an abstraction stops looking like architecture astronautics when three unrelated application features independently demand it.

**If three roads keep meeting at the same foundation, maybe build the foundation.**

## PostgreSQL-specific failure should stay PostgreSQL-specific

A universal database abstraction often wants to normalize errors too.

There is value in common categories.

There is also danger in flattening away useful information.

Constraint violations, protocol/connection failures, transaction state, and database-specific diagnostics can matter to real application code.

The current design therefore starts with PostgreSQL-specific typed failure rather than pretending every database has one universal error model.

Again, common abstractions can appear after we know what is actually common.

## This is not an ORM project

I have to keep reminding myself of this because the slippery slope is impressive.

Database surface.

Then query builder.

Then migrations.

Then relationships.

Then entity tracking.

Then suddenly the self-made language also has a self-made ORM framework and nobody knows what happened.

#322 explicitly keeps these out of scope:

- universal Database API
- PostgreSQL protocol implementation
- full ORM
- migration tooling
- SQLite

The initial goal is already large enough:

```text
pool
-> parameterized query
-> typed row decode
-> transaction/resource behavior
-> close
```

If that works in normal Seseragi application code, I will be very happy.

## The pattern is becoming consistent

HTTP uses an existing host engine behind a Seseragi public contract.

WebSocket will use host implementations behind Effect/Stream/resource semantics.

PostgreSQL uses an existing external driver behind a database-specific Seseragi package.

The rule is not "hide the host because host APIs are bad."

The host implementations are exactly what make this practical.

The rule is:

**Borrow the execution engine. Own the meaning the source program depends on.**

It is still slightly ridiculous that PostgreSQL is on the roadmap of the language I started building not that long ago.

But at least the architecture does not require me to invent an entirely new programming model every time the roadmap grows another external service.