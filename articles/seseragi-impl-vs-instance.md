---
title: "Sometimes an Operation Belongs to a Type. Sometimes It Belongs to a Capability."
published: false
tags: programming, types, functional, seseragi
description: "impl and instance can look like two ways to attach behavior to a type. I kept both because they answer different semantic questions."
series:
main_image:
canonical_url:
---

Sometimes I want to put an operation next to a type.

Sometimes I look at the same idea and think:

> This is not really a property of that one type. This is a shared capability.

Those two feelings are close enough that it is tempting to make one language feature handle both.

Seseragi currently keeps them separate:

```text
impl
instance
```

They both involve implementing behavior around types.

They do not mean the same thing.

## If the operation belongs specifically to the nominal type, use `impl`

Suppose I have:

```rust
struct Box<A> {
  value: A,
}
```

An operation such as unwrapping the Box is naturally about `Box` itself:

```rust
impl<A> Box<A>
where Show<A> {
  fn unwrap self: Box<A> -> A =
    self.value
}
```

I read this as:

```text
Here are operations defined specifically for Box.
```

The current specification also allows type-local operator declarations inside an `impl` surface.

For example, fixtures use shapes like:

```rust
impl<A> Box<A>
where Show<A> {
  pub fn copied self: Box<A> -> Box<A> =
    Box { value: self.value }

  operator + self -> other: Box<A> -> Box<A> =
    other
}
```

The important part is that `impl` starts from a nominal type identity.

This is behavior I am intentionally grouping with **this type**.

## Rust looks very familiar here, but Seseragi splits the words differently

Rust has inherent implementations:

```rust
impl MyType { ... }
```

and trait implementations:

```rust
impl SomeTrait for MyType { ... }
```

Both use the word `impl`.

That is coherent in Rust's language model.

Seseragi could have done the same thing.

Instead, I kept two surface words:

```text
impl
  -> type-specific operation

instance
  -> implementation of a shared trait capability
```

This is one of those places where Seseragi can look Rust-like at first glance and then deliberately not follow Rust's exact grouping.

The reason is mostly readability.

When I see the declaration, I want to know which semantic question I am answering.

Am I adding behavior specific to a nominal type?

Or am I proving that a type participates in a reusable capability shared with other types?

## `Show` is not really a Box-specific idea

Now consider displaying a value as text.

Seseragi can describe a shared capability:

```rust
trait Show<A> {
  fn show value: A -> String
}
```

Many types can support Show.

Int can.

String can.

Arrays and ADTs can.

A custom type can too.

So if `Badge` supports Show, the thing I want to say is not:

> Badge has a random method named show.

It is:

> Badge satisfies the same Show contract other types satisfy.

That is an `instance`:

```rust
instance Show<Badge> {
  fn show value: Badge -> String =
    match value {
      Active -> "active"
      Paused -> "paused"
    }
}
```

The implementation happens to be for Badge.

The meaning belongs to the shared trait.

That is the difference I wanted syntax to preserve.

## Haskell makes the `instance` side especially obvious

Haskell type classes put this model front and center.

Generic code can require something like:

```text
Show a
```

and an instance supplies that capability for a concrete type.

Seseragi borrows a lot of that conceptual shape.

But I did not want every ordinary type-specific operation to become a type-class method too.

Web application code has plenty of operations that simply belong near a domain type and do not need to become a globally reusable abstraction.

So I kept `impl` as well.

This is one of the places where Seseragi does not try to make one abstraction win everywhere.

## Go and TypeScript make conformance lighter in different ways

Go interfaces are satisfied implicitly by method sets.

TypeScript's structural typing often lets a value satisfy a contract because its shape already matches.

Both can remove a lot of ceremony.

I understand the appeal, especially after years of Web development.

Seseragi's type-class side makes a different choice because the compiler needs to track explicit instance evidence through generic constraints.

If I write:

```rust
fn render<A> value: A -> String
where Show<A> =
  show value
```

then `render` does not know what `A` is.

It only knows that a `Show<A>` instance is available.

The exact evidence selected for that capability has to stay coherent through typing, modules, and lowering.

That is a stronger semantic role than "this object happens to have a method with the right name."

## The difference becomes obvious in generic code

Consider again:

```rust
fn render<A> value: A -> String
where Show<A> =
  show value
```

This function cannot depend on some `Box`-specific inherent method unless it knows the concrete type is Box.

It does not.

What it can depend on is the abstract capability declared in `where`.

That is exactly where `instance` earns its separate identity.

The generic function asks:

```text
Does A have Show evidence?
```

not:

```text
Does A happen to define this type-specific method?
```

The two mechanisms may both result in callable operations.

Their abstraction boundaries are different.

## I did briefly wonder whether one of them was redundant

Language features are expensive.

Every new declaration form means parser work, typed representation, tooling, formatting, documentation, and more things for users to learn.

So the obvious simplification questions are:

> Could `impl` do everything?

or:

> Could trait/instance do everything?

Probably, with enough design work.

But collapsing syntax is only a win if the meanings genuinely collapse too.

Here they did not.

```text
impl
  -> this nominal type has type-specific operations

instance
  -> this type satisfies a reusable trait contract
```

I would rather have two words than one word whose meaning silently changes depending on context.

## Operators connect the two worlds in an interesting way

Seseragi has standard operator traits.

So an operator such as `+` can have trait-level semantics shared across types.

At the same time, the surface can let a nominal type define its operator close to the type through `impl`-style syntax.

Conceptually, that means something like:

```rust
impl Vector {
  operator + ...
}
```

can be pleasant to author near `Vector`, while the language meaning still connects to the common operator trait contract.

I like this split:

**author the implementation near the type, but keep the capability identity shared.**

It is also exactly the kind of design that becomes dangerous if the compiler maintains two separate truths underneath.

## We already found what happens when instance semantics split internally

Seseragi currently has an open issue around standard Prelude instances:

https://github.com/KentaroMorishita/seseragi/issues/394

A user-defined `Eq<Status>` can satisfy a generic `where Eq<A>` call.

But standard `Eq<Int>` has had a path where ordinary `==` works while generic evidence selection says the instance is unavailable.

That bug is important here because it proves `instance` is not just another convenient declaration syntax.

If the compiler says a type satisfies a shared capability, that capability has to remain the same thing whether it is used through:

```text
an operator
a named trait method
a generic where constraint
an imported function
```

Otherwise the shared contract is not actually shared.

## The Prelude registry still needs one canonical truth too

A related open issue is:

https://github.com/KentaroMorishita/seseragi/issues/329

Seseragi's standard library specification names traits and methods across equality, ordering, hashing, showing/debugging, algebraic operations, Functor/Applicative/Monad, collection abstractions, JSON codecs, arithmetic operators, and more.

Today, some of that semantic knowledge still lives in different internal registries and special-case paths.

#329 is about consolidating the canonical Prelude trait/method/instance surface so Reference, Analysis, operator dispatch, and generic instance selection stop drifting apart.

That sounds like an implementation detail.

It is also necessary if `instance` is going to mean one stable language concept.

## `impl` is about ownership. `instance` is about participation.

This is the shortest way I have found to distinguish them.

`impl` says:

```text
This operation belongs with this nominal type.
```

`instance` says:

```text
This type participates in this shared capability.
```

Those often meet.

A type can have its own methods and also implement Show, Eq, Functor, or some domain trait.

But I do not want the fact that both are "implementations" to erase the difference between ownership and participation.

## One concept fewer is not automatically simpler

I like languages that avoid unnecessary concepts.

That does not mean I want the smallest possible keyword count.

If two things have different rules, different coherence requirements, different generic behavior, and different reading intent, merging their syntax can make the language *look* smaller while making the mental model fuzzier.

Seseragi separates `impl` and `instance` because I found the opposite tradeoff clearer:

```text
two visible constructs
two visible meanings
```

rather than:

```text
one construct
context decides which meaning you meant
```

That is not necessarily the right answer for every language.

It is the answer that fits how I want Seseragi code to read.

The Tour is here:

https://seseragi.vercel.app/tour/

What started as "do I really need two implementation syntaxes?" ended up reminding me of a broader rule I keep rediscovering while building the language:

**Do not merge two concepts just because their code happens to sit near the same type.**