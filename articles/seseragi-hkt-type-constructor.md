---
title: "At Some Point, I Wanted to Pass a Type Constructor Around Like a Type"
published: false
tags: programming, types, functional, seseragi
description: "Generics gave me A. Then Functor made me want F<_>. That is how Seseragi wandered into higher-kinded types without starting from HKT as a goal."
series:
main_image:
canonical_url:
---

When I added ordinary generics to Seseragi, everything still felt very normal.

```rust
fn keep<A> value: A -> A = value
```

`A` stands for some type.

Nothing surprising there.

Then I started building traits such as Functor and ran into a more annoying question:

**What if the thing I want to abstract over is not the value type inside the container, but the container shape itself?**

That is where this appeared:

```rust
fn keepShape<F<_>, A> value: F<A> -> F<A> = value
```

`F<_>`.

A parameter for a type that still expects another type.

At that point I had accidentally arrived at higher-kinded types.

## `A` is not enough when the outer shape matters

Look at:

```text
Maybe<Int>
Maybe<String>
```

The payload changes.

The outer shape stays `Maybe`.

The same happens with:

```text
Array<Int>
Array<String>
```

If I only need to abstract over the payload, an ordinary type parameter works:

```text
A
```

But sometimes the operation I want to describe is about the outer type constructor.

For example:

```text
map over Maybe
map over Array
map over List
map over Effect
map over Signal
```

Those operations are structurally related.

If I want one trait to describe that relationship, I need a parameter for the thing that takes `A` and produces `F<A>`.

That is what:

```text
F<_>
```

represents.

## The notation looks Haskell-ish because the idea is Haskell-shaped

Haskell programmers are already comfortable with types such as:

```text
f a
```

where `f` is itself a type constructor.

Functor is centered on exactly this idea.

Seseragi's trait can look like:

```rust
trait Functor<F<_>> {
  fn map<A, B> f: (A -> B) -> value: F<A> -> F<B>
}
```

That is clearly in the same conceptual family.

But my starting point was not:

> I want a Haskell-style kind system.

I did not build Seseragi from years of Haskell production experience.

The pressure came from ordinary code:

```text
Maybe needs map
Array needs map
Either needs map
Effect needs map
Signal needs map
```

At some point, defining all of those as unrelated ideas felt stranger than letting the type system express the common shape.

Then I looked at the result and thought:

**Oh. This is HKT.**

## Rust and TypeScript expose a different set of tools

Rust has powerful generics and traits, but it does not give users the same direct surface:

```text
F<_>
```

for an arbitrary one-argument type constructor.

Similar abstractions are possible through different designs involving traits, associated types, GATs, and other patterns.

TypeScript has an extremely expressive type system too, but again the everyday surface is not:

```text
accept a type constructor F<_>
and later form F<A>
```

The interesting difference is not simply which language is "more powerful."

It is which concept the language chooses to expose directly to the programmer.

Seseragi puts `F<_>` on the surface because Functor, Applicative, and Monad are intended to be ordinary reusable capabilities rather than deep library tricks that every abstraction has to encode differently.

## I still do not want application code to feel like an HKT exercise

This part matters a lot to me.

Supporting `F<_>` does not mean every Seseragi program should be full of kind notation.

A normal application can just use:

```text
Maybe<User>
Array<Item>
Task<Error, Result>
Signal<State>
```

and never write a higher-kinded parameter itself.

The feature exists so reusable abstractions can say what they actually mean.

The abstraction layer may be sophisticated.

The code using the abstraction should remain ordinary.

That distinction is easy to lose when talking about advanced type-system features.

## The Tour tries to show the outer-shape idea before the acronym

The current Tour uses a deliberately tiny example:

```rust
fn keepShape<F<_>, A> value: F<A> -> F<A> = value

fn render value: Maybe<Int> -> String = match value {
  Nothing -> "Nothing"
  Just item -> `Just ${item}`
}

pub effect fn main = Just 42 |> keepShape |> render |> println
```

https://seseragi.vercel.app/tour/

`keepShape` does not know or care that `F` is `Maybe`.

It only preserves the outer constructor and payload type.

The Tour work around generics, traits, and `F<_>` was tracked in:

https://github.com/KentaroMorishita/seseragi/issues/178

That issue is complete now.

I like the teaching order because "higher-kinded type" sounds much more frightening than the code needs to feel.

First notice:

```text
I want to abstract over Maybe/Array/etc.
```

Then introduce the name for that capability.

## HKT became necessary because I did not want a special `map` for every container

There is a completely valid alternative design:

```text
Maybe.map
Array.map
List.map
Effect.map
Signal.map
```

Many languages and libraries do exactly this.

It can be wonderfully direct.

Go often prefers concrete operations over broad abstraction.

TypeScript libraries frequently expose functions or methods per concrete type/module.

Seseragi went another direction because I wanted `map` to be the same conceptual operation wherever the type supports Functor.

That means code can read like:

```rust
map normalize users
map show maybeValue
map decode task
```

and instance resolution chooses the appropriate implementation.

At that point `F<_>` stops looking like an academic trophy.

It becomes infrastructure for a very mundane user experience:

**Same meaning, same operation name.**

## Either makes the whole idea more interesting

`Maybe` is convenient because it already takes one type argument:

```text
Maybe<_>
```

`Either` takes two:

```text
Either<E, A>
```

But the usual Functor mapping changes only the successful `A` side while keeping the error type `E` fixed.

So what I really want to hand to `Functor<F<_>>` is something like:

```text
Either<E, _>
```

That is a two-argument type constructor with one slot already filled.

Now HKT and type-level partial application meet each other.

This is the point where the design starts looking much more sophisticated than the problem that created it.

The original request was still basically:

> I want the same `map` idea for Either too.

## The compiler has to remember that `F` is not an ordinary type variable

Parsing:

```rust
F<_>
```

is the easy part.

The hard part is preserving what it means.

The compiler has to know that `F` expects one type argument.

That information must survive through:

```text
resolution
typed HIR
public module interfaces
Core IR
backend lowering
instance selection
imports / exports
```

Seseragi did have a regression where kind/arity metadata and constraints survived some declaration surfaces but were silently lost in others.

That became Issue #196:

https://github.com/KentaroMorishita/seseragi/issues/196

The issue is closed now.

Its important requirement was not "make this one HKT example work."

It was to carry generic parameter name, kind/arity, constraints, and evidence consistently across declarations and module boundaries without reconstructing the information later from guesses.

That is the real cost of making `F<_>` ordinary source syntax.

## "Works locally" is a dangerously low bar for HKT

A compiler can appear to support higher-kinded parameters if one local file type-checks.

That is not enough.

If I export a declaration containing `F<_>` and another module imports it, the type constructor still has to have the same arity and constraints.

If the public interface serializes `F` as if it were just another `A`, the abstraction has changed meaning.

If backend lowering erases the wrong metadata, instance dictionaries may no longer line up.

So one of the recurring lessons for me has been:

**Advanced type syntax is only real if its identity survives boring engineering boundaries.**

Modules are where fancy type systems become very practical implementation work.

## This is the funny part: the surface got simpler as the internals got stranger

For the user, the abstraction I want is easy to read:

```rust
fn keepShape<F<_>, A> value: F<A> -> F<A> = value
```

For the compiler, that one line means kind-aware generic metadata, constraint propagation, interface fidelity, and backend representation decisions.

Seseragi keeps doing this to me.

I try to make the source model feel ordinary.

The implementation underneath gets less ordinary in order to preserve that illusion consistently.

There is probably a law of language design hiding in there.

## Try reading `F<_>` before reading "higher-kinded type"

The Playground/Tour is here:

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Look at:

```rust
fn keepShape<F<_>, A> value: F<A> -> F<A> = value
```

and ignore the acronym HKT for a moment.

Ask only:

```text
What is F?
```

It is the outer type shape.

`Maybe` can be `F`.

`Array` can be `F`.

A partially applied `Either<E, _>` can be `F`.

Once that picture is clear, "higher-kinded type" is just the name for the thing you already wanted.

That is almost exactly how the feature entered Seseragi.