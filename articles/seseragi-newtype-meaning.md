---
title: "Sometimes Giving a Type a Name Is the Whole Point"
published: false
tags: programming, types, domain, seseragi
description: "UserId and OrderId can both be integers at runtime and still be different things in the program. Newtype lets the type system remember that."
series:
main_image:
canonical_url:
---

One of the smallest type-system features I wanted in Seseragi was `newtype`.

Suppose a user ID is represented by an integer.

At runtime, maybe it is just:

```text
42
```

But inside an application, that value is not merely "the number 42."

It is **User ID 42**.

That difference is exactly the kind of thing a type system can remember for me.

## Same representation, different type

Seseragi can write:

```rust
newtype UserId = Int
```

and construct a value with:

```rust
let id = UserId 42
```

The payload is one `Int`.

The type is `UserId`.

That means a function can demand the meaning, not just the representation:

```rust
fn requestPath id: UserId -> String =
  `/users/${raw id}`
```

This should not accept an arbitrary integer:

```rust
requestPath 42
```

Even though `UserId` contains an `Int`, `Int` and `UserId` are not the same type.

That is the entire reason the feature exists.

## This is closely related to why I kept both Record and Struct

I ran into a similar question with structured data.

A Record can say:

```text
this shape is enough
```

while a nominal Struct can say:

```text
this value must specifically be this domain type
```

Newtype is the same instinct compressed down to a single payload.

Sometimes the representation tells me almost nothing about the meaning.

User IDs, order IDs, quantities, currencies, encoded strings, timestamps — many domain values can share the same primitive representation while remaining completely different concepts.

The type name is not decoration.

It is the information I was missing.

## Haskell has exactly the word `newtype`

Haskell makes this pattern explicit:

```haskell
newtype UserId = UserId Int
```

The idea is especially clear there: create a distinct type identity without necessarily introducing a meaningfully heavier runtime representation.

Rust commonly uses the newtype pattern with a tuple struct:

```rust
struct UserId(i64);
```

Go can define a distinct named type over an underlying type:

```go
type UserID int
```

TypeScript does not have a built-in nominal newtype, so projects often simulate one with branding:

```ts
type UserId = number & { readonly __brand: "UserId" }
```

That pattern is genuinely useful.

I have used ideas like it in Web code because `number` alone does not tell me enough.

PHP often goes further in the runtime direction with a value object:

```php
final class UserId
{
    public function __construct(public readonly int $value) {}
}
```

All of these are answers to roughly the same complaint:

**I know these two values have the same machine representation. I still do not want to mix them.**

Seseragi's surface looks Haskell-like, but the motivation was extremely application-shaped.

I just do not want to accidentally pass an Order ID where a User ID is expected.

## `42` and `42` can mean different things

Consider:

```rust
newtype UserId = Int
newtype OrderId = Int
```

Now these values:

```text
UserId 42
OrderId 42
```

contain the same integer.

They are still different types.

That distinction sounds almost trivial in a toy example.

In a real application, it is exactly the kind of mistake that otherwise survives until much later.

The database column types may both be integers.

The JSON fields may both be numbers.

The runtime representation may be identical.

The domain meaning is not.

Newtype lets the compiler keep the domain distinction alive after serialization formats and primitive representations try to erase it.

## I did not want automatic conversion back to Int

If `UserId` silently became `Int` whenever convenient, the feature would lose much of its value.

So Seseragi does not implicitly unwrap a Newtype into its underlying representation.

It also does not implicitly turn an `Int` into `UserId`.

To extract the payload, the current sample just uses ordinary pattern matching:

```rust
fn raw id: UserId -> Int = match id {
  UserId value -> value
}
```

I like this because Newtype does not need a special mini-language for unwrapping.

It is a constructor with one payload.

Patterns already know how to receive constructor payloads.

Use the normal language feature.

Rust can destructure a tuple struct or access its field.

Go generally uses explicit conversion between named and underlying types.

The exact syntax differs, but the shared principle makes sense to me:

**If you bothered to create a distinct type, do not erase that distinction implicitly every five minutes.**

## A type alias would not solve the same problem

This is an important distinction.

A type alias gives another name to the same type.

A Newtype creates a new type identity.

Conceptually:

```text
Int
  ↓ another name for the same type
alias
```

versus:

```text
Int
  ↓ distinct nominal type with the same underlying representation
newtype UserId
```

In TypeScript:

```ts
type UserId = number
```

still leaves `UserId` structurally identical to `number`.

That is useful if the goal is naming or readability.

It does not prevent accidental mixing.

A Seseragi Newtype exists specifically because I wanted the second behavior.

The constructor is part of that distinction.

## The interesting question becomes: what capabilities should it inherit?

Once `UserId` is distinct from `Int`, another question appears immediately.

`Int` can do many things.

Should `UserId` automatically be allowed to do all of them?

Equality probably makes sense.

Showing it for debugging probably makes sense.

But arithmetic?

```text
UserId + UserId
```

What does that even mean?

Maybe nothing useful.

If every trait and operator from the underlying type flowed automatically into the Newtype, the new type identity would be much weaker than it first looked.

So I prefer the principle that capabilities should remain explicit.

The representation can be transparent in selected places without making the type semantically identical everywhere.

## JSON makes this boundary especially interesting

Seseragi's nominal-type deriving work includes plans for `JsonEncode` and `JsonDecode` on Structs, ADTs, and Newtypes.

That work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/293

As of this draft, #293 is still open.

The specification for Newtype JSON is deliberately transparent: encode/decode through the inner value's codec rather than adding an extra wrapper object solely because the program has a nominal type.

That gives an interesting split:

```text
Inside the program:
  UserId is distinct from Int

On the JSON wire:
  use the underlying Int representation
```

I like that because "preserve type identity" does not have to mean "make every external representation heavier."

The language can decide where identity matters and where representation can remain transparent.

## This is where a tiny type feature stops being tiny

At first, Newtype sounds like:

> Put a name around one existing type.

Then implementation questions start appearing:

- constructor typing
- pattern matching
- nominal identity
- module interfaces
- derived instances
- trait coherence
- generic Newtypes
- JSON codecs
- display/debug behavior
- explicit vs inherited operations

The source syntax stays small:

```rust
newtype UserId = Int
```

The semantic promise is not small.

That pattern keeps happening while I build Seseragi.

The simplest-looking syntax often represents the strongest demand on consistency.

## The runtime can stay boring while the source gets safer

This is probably the part I like most.

I do not necessarily want `UserId` to become a heavyweight runtime object.

I want it to become a heavyweight **meaning** in the type checker.

Those are not the same thing.

A PHP value object can deliberately make the runtime representation explicit and object-shaped.

That can be a great tradeoff.

A Newtype takes another path: keep the underlying representation simple while giving the compiler an extra distinction to enforce.

The application becomes harder to misuse without requiring every domain distinction to become a new runtime allocation model.

## Try removing the constructor

The current Playground/Tour sample looks like this:

```rust
newtype UserId = Int

fn raw id: UserId -> Int = match id {
  UserId value -> value
}

fn requestPath id: UserId -> String =
  `/users/${raw id}`

pub effect fn main =
  UserId 42
  |> requestPath
  |> println
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Now remove the constructor:

```rust
pub effect fn main =
  42
  |> requestPath
  |> println
```

The runtime integer looks the same.

The type does not.

That failure captures the whole point of Newtype for me.

I did not want to make the value heavier.

I wanted to make the **meaning harder to accidentally throw away**.

Sometimes giving a type a name really is the feature.