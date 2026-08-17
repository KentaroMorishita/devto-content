---
title: "Then I Wanted Partial Application for Types Too"
published: false
tags: programming, types, functional, seseragi
description: "Value-level partial application felt natural. Then Either<E, A> made me want to fix E and leave A open — and the same idea climbed into the type system."
series:
main_image:
canonical_url:
---

Seseragi functions are curried from the start.

So this feels ordinary:

```rust
fn add x: Int -> y: Int -> Int = x + y

let add10 = add 10
```

Give one argument now.

Keep the function waiting for the rest.

I already liked that model at the value level.

Then the type system started asking for the same thing.

## `Either` has two type arguments, but Functor usually cares about one

Consider:

```text
Either<String, Int>
```

The left type is the error.

The right type is the success value.

If I map over the successful value, I want something like:

```text
Either<String, Int>
        ↓ map
Either<String, String>
```

The error type stays fixed.

Only the right side changes.

So the shape I really want is:

```text
Either<String, _>
```

Fill one type argument now.

Leave one slot open for later.

That is basically partial application, except the thing being applied is a type constructor.

## This only makes sense once `F<_>` is already a thing

Seseragi can describe Functor roughly like this:

```rust
trait Functor<F<_>> {
  fn map<A, B> f: (A -> B) -> value: F<A> -> F<B>
}
```

`Maybe` fits directly:

```text
F = Maybe
```

because `Maybe` expects one type argument.

But `Either` expects two.

So to make it fit the one-slot shape `F<_>`, I need to turn:

```text
Either<E, A>
```

into:

```text
Either<E, _>
```

Now the error side is fixed and the successful value remains the slot that Functor can transform.

That is the connection between higher-kinded parameters and type-level partial application.

## Haskell makes this look completely normal

In Haskell, `Either e` is already a type constructor waiting for one more type.

So Functor and Monad instances naturally operate on the right side while keeping the error type fixed.

If you know Haskell, this whole story can sound like I reinvented a very ordinary idea.

Fair enough.

But the path that got me there in Seseragi did not begin with:

> I should reproduce Haskell's kind system.

It began with a much more application-shaped desire:

```text
I have a bunch of Either<ApiError, A> values.
I want the same map / Applicative / Monad abstractions to work on them.
```

Then the missing shape was obvious:

```text
Either<ApiError, _>
```

The type theory name came after the pressure from ordinary code.

## This is the exact same feeling as value-level partial application

At the value level:

```rust
let add10 = add 10
```

fixes one input and leaves another input open.

At the type level:

```text
Either<String, _>
```

fixes one type argument and leaves another type argument open.

The mechanics are not literally identical inside the compiler.

But the mental model is satisfyingly similar:

```text
provide part of the input now
↓
keep a function-like thing waiting for the remaining input
```

That symmetry was not something I planned when I first added partial application for functions.

It emerged later.

Those are some of my favorite moments in language design: when a rule introduced for one reason starts making sense somewhere else too.

## Rust and TypeScript solve the abstraction through different machinery

Rust has generics and traits powerful enough to express sophisticated abstractions, but its surface does not let me simply pass:

```text
Either<E, _>
```

as an arbitrary one-argument type constructor in the same direct way.

Different trait encodings, associated types, GATs, wrapper types, or other techniques come into play depending on the design.

TypeScript also has enormous type-level expressiveness, but again, the ordinary language surface is not built around "partially apply a generic type constructor and pass the remainder as `F<_>`."

This is not a strength ranking.

It is a difference in what each language chooses to make a first-class visible concept.

Seseragi makes the hole visible because Functor / Applicative / Monad are intended to be straightforward user-facing abstractions.

## The abstraction becomes useful with real error types

Imagine an application with:

```text
Either<ApiError, User>
Either<ApiError, Session>
Either<ApiError, Profile>
```

All of these share the same outer type constructor once the error type is fixed:

```text
Either<ApiError, _>
```

So the language can define an instance such as:

```rust
instance<E> Functor<Either<E, _>> {
  fn map<A, B>
    f: (A -> B)
    -> value: Either<E, A>
    -> Either<E, B> =
    match value {
      Left error -> Left error
      Right item -> Right (f item)
    }
}
```

Nothing about this needs `ApiError` to be special.

Nothing about this needs `Either` to be compiler hard-coded as "the one type that maps on its second argument."

The type constructor simply has one remaining slot.

That is the part I wanted the type system to understand generically.

## It gets more Haskell-looking very quickly

The current specification includes shapes like:

```rust
alias StateT<S, M<_>, A> = S -> M<(A, S)>
alias Wrapped<F<_>, A> = F<A>

alias OptionalState<S, A> = StateT<S, Maybe, A>
alias EitherState<E, S, A> = StateT<S, Either<E, _>, A>
```

At this point, yes, the code starts looking like it wandered pretty far into Haskell territory.

But the progression still feels incremental to me.

First:

```text
A
```

Then:

```text
F<_>
```

Then:

```text
Either<E, _>
```

Each step appears because the previous abstraction hits one specific limitation.

The end result looks advanced when viewed all at once.

The individual questions were much smaller.

## The compiler has to count the holes

This is where the cute underscore becomes serious.

The compiler needs to know:

```text
Int                  -> a complete value type
Maybe                 -> expects 1 type argument
Either                -> expects 2
Either<String, _>     -> expects 1 remaining type argument
F<_>                  -> requires a one-argument type constructor
```

So `_` in this context is not a vague "whatever" placeholder.

It changes the kind/arity of the partially applied constructor.

`Either<String, _>` must be valid where `F<_>` is expected.

Bare `Either` must not be silently treated as the same thing because it still expects two arguments.

This is where kind information stops being optional compiler metadata.

## And the compiler has to remember the hole across modules

It is not enough for the parser to understand:

```text
Either<E, _>
```

A public alias or instance using that type constructor may be exported.

Another module may import it.

The public interface must still know how many type slots remain.

Core IR and backend lowering must not flatten the distinction away accidentally.

Seseragi had a real regression in this area, tracked by #196:

https://github.com/KentaroMorishita/seseragi/issues/196

That issue is now closed.

Its goal was to preserve generic parameter kind/arity and constraints across declarations, typed interfaces, Core IR, TypeScript IR, and imported code rather than re-inferring or discarding the information later.

This is the implementation side of a recurring rule:

**If the language exposes a type distinction, module boundaries are not allowed to forget it.**

## The surface is almost suspiciously lightweight

For the user, the key notation is simply:

```text
Either<E, _>
```

One underscore.

For the compiler, that underscore means:

- partial type application
- remaining arity
- kind compatibility
- instance-head matching
- interface serialization
- generic substitution
- backend representation decisions

This gap between surface size and semantic weight is becoming a theme in Seseragi.

I keep wanting small notation for ordinary ideas.

Then the compiler has to become very disciplined to make that notation truthful.

## I did not expect function partial application to echo up here

When I first made this natural:

```rust
let add10 = add 10
```

I was thinking about function ergonomics.

I was not thinking:

> Eventually I will want partially applied binary type constructors for HKT instances.

But once Functor and `F<_>` existed, the same shape reappeared.

That is the part I find fun.

The language starts producing consequences I did not explicitly schedule as features.

A decision becomes a pattern.

Then the pattern climbs into another layer.

## Try reading the underscore as "one argument still missing"

The Tour is here:

https://seseragi.vercel.app/tour/

The easiest way to make the notation feel less abstract is to read:

```text
Either<String, _>
```

as:

```text
Either with String already supplied,
waiting for one more type
```

That is all.

From there:

```text
F = Either<String, _>
```

inside `Functor<F<_>>` becomes much easier to see.

The theory says higher-kinded types and type-constructor partial application.

The feeling that produced the feature was simpler:

**I already know the error type. Leave the success type open.**

Apparently the type system had a name for that too.