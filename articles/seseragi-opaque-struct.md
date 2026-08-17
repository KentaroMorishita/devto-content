---
title: "I Want to Export the Type Without Exporting Its Shape"
published: false
tags: programming, types, modules, seseragi
description: "A public type and a public representation are not the same promise. That is why Seseragi has an opaque struct in the spec."
series:
main_image:
canonical_url:
---

There is a piece of Seseragi syntax I like almost entirely because of what the name promises:

```rust
pub opaque struct UserId {
  value: Int,
}
```

**opaque struct**.

The type name is public.

The representation is not.

That separation feels extremely useful.

There is only one problem right now: the feature is specified, but it is not implemented on current `main` yet.

## A public Struct normally makes its shape part of the contract

A normal public Struct might look like:

```rust
pub struct User {
  id: Int,
  name: String,
}
```

If that structure is intentionally part of the public API, this is great.

Callers can construct the value, read its fields, pattern-match on it, and generally depend on the representation.

But sometimes I want a different promise.

Take `UserId`.

Today the implementation might be:

```text
{ value: Int }
```

That does not mean I want every consumer to permanently depend on the fact that `UserId` is represented by one integer field called `value`.

Maybe later I want a String representation.

Maybe I want validation metadata.

Maybe I want to change the internal layout completely.

If consumers already reach into `.value`, the representation has become API.

What I actually want to publish is much smaller:

```text
There is a type called UserId.
You may receive one and pass one around.
Use the public functions I provide to construct or inspect it.
```

That is a different contract.

## Publishing a type and publishing its representation are separate decisions

This is the whole feature for me.

I already chose to keep both structural Records and nominal Structs in Seseragi because "same shape" and "same meaning" are different questions.

Opaque Struct adds another axis:

```text
What is the type?
```

and:

```text
How much of its representation is public?
```

Those should not have to be the same decision.

A type can be fully public while its field layout remains an implementation detail.

That is what `opaque` says.

## Rust, Haskell, Go, and PHP already solve versions of this

Rust can export a Struct type while keeping its fields private:

```rust
pub struct UserId {
    value: i64,
}
```

Code outside the module can name `UserId`, but it cannot directly construct or access a private `value` field.

Haskell modules can export a type name while hiding the constructor, which makes the representation inaccessible to callers.

Go can export a type with unexported fields.

PHP code has been doing the same broad thing for years with private properties and public methods.

So representation hiding is not exotic.

The interesting question was how I wanted it to look in Seseragi.

I did not want to introduce a class-oriented object model just to get encapsulation.

I wanted to stay in the same data-oriented world:

```text
Struct for data
module boundary for visibility
ordinary functions / impl for operations
```

and say explicitly on the declaration that the representation is hidden.

## TypeScript makes this boundary feel different

TypeScript can absolutely hide fields with classes:

```ts
class UserId {
  #value: number
}
```

But that means entering the class model.

Seseragi already has Records and Structs as data types, and I did not want "I need representation hiding" to imply "now this value has to become a class."

The data model and the visibility model should be separable.

That is a recurring thing I keep wanting while building Seseragi:

**Do not make me switch programming models just because one property of the value changed.**

## The boundary I want is module-shaped

Conceptually, an opaque Struct should behave like this:

```text
inside the declaring module
  -> construct it
  -> read fields
  -> pattern match on representation

outside the declaring module
  -> refer to the type
  -> pass values around
  -> call public constructors/accessors
  -> do not touch the representation
```

That gives the module owner room to change the internals later.

A public smart constructor can enforce invariants.

A public accessor can expose exactly what callers need.

But callers cannot accidentally build a permanent dependency on field layout.

This is ordinary encapsulation, just without requiring an object/class model.

## Newtype is related, but it solves a different problem

Seseragi also has Newtype:

```rust
newtype UserId = Int
```

Newtype is mainly about type identity.

`UserId` and `Int` should not mix just because one wraps the other.

Opaque Struct is about **representation visibility**.

It can have multiple fields.

It can maintain a richer internal shape.

The key question is not only:

```text
Is this a distinct nominal type?
```

but:

```text
Who is allowed to know how that nominal type is represented?
```

The features are adjacent, not redundant.

## Backend representation should not automatically become language API

This matters even more because Seseragi currently targets TypeScript as its first backend.

Generated TypeScript has to represent values somehow.

Maybe an opaque Struct becomes some JavaScript object internally.

That does **not** mean the object's fields should automatically become part of Seseragi's public API.

The language boundary should remain stronger than the backend's incidental object shape.

That means opacity has to survive into things such as:

- public module interface artifacts
- generated declarations
- Analysis / hover
- completion
- re-exports
- downstream type checking

A backend implementation detail is not a language feature just because it exists at runtime.

This is one of the reasons I like having Core IR and explicit module interfaces instead of treating emitted TypeScript as the source of truth.

## The current compiler does not support it yet

The specification and fixtures already describe:

```rust
pub opaque struct UserId {
  value: Int,
}
```

But the current parser and typed Struct model do not yet carry a separate representation-visibility flag for `opaque`.

The missing implementation is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/347

As of this draft, #347 is still open.

And once you look at the issue, it becomes obvious why "just add a keyword" is not enough.

Opacity has to remain true across:

```text
construction
field access
patterns
record-like update/spread surfaces
imports
re-exports
generic opaque structs
deriving
module interfaces
LSP completion and hover
backend declarations
```

A field that is hidden directly after import must not mysteriously become visible after one re-export through another module.

That would be an impressively bad kind of transparency.

## Re-export is the test that makes the idea real

One of the fixtures required by #347 is effectively:

```text
module A defines opaque type
module B re-exports it
module C imports from B
```

Module C should still see the type identity without gaining access to the representation.

I like this test because it catches a shallow implementation immediately.

If `opaque` is only checked at the first import site, it is not really part of the type's public interface contract.

Visibility has to travel with the exported type information.

The representation does not become public merely because the type crossed another module boundary.

## Opaque does not mean secure

The name can sound stronger than it is.

This is not encryption.

It is not sandboxing.

It is not a runtime capability boundary.

It is language-level representation hiding.

The goal is to control what consumers are allowed to depend on in source code.

That is already valuable enough.

I do not want to pretend it provides security properties it does not.

## The feature is really about future freedom

The direct benefit is encapsulation.

The longer-term benefit is that I can change implementation details without breaking every caller.

Suppose I start with:

```rust
pub opaque struct UserId {
  value: Int,
}
```

and later want:

```text
some validated/string-based/internal representation
```

If consumers only depend on the public `UserId` type and public functions, I can evolve the inside.

If they depend on `.value`, I cannot.

So `opaque` is partly a feature for the library author's future self.

It says:

**This type is part of the contract. Its current field layout is not.**

## This is specification code for now

At the moment, this is not a working Playground example:

```rust
pub opaque struct UserId {
  value: Int,
}
```

Issue #347 is still waiting for implementation.

The Playground and Tour are here for the features that already exist:

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Once opaque Structs are implemented, I expect the documentation to become very boring:

> `pub opaque struct` exports nominal type identity while hiding representation outside the declaring module.

That is probably what good reference documentation should say.

But the reason I want the feature is more interesting to me than the final sentence:

> I want callers to know **what this value is** without making them know **how I happen to store it today**.

Those are two different promises, so the language should let me make them separately.