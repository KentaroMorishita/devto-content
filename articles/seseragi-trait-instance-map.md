---
title: "I Didn't Want a Different map for Every Type"
published: false
tags: programming, types, functional, seseragi
description: "Maybe can map. Array can map. Signal can map. At some point, giving the same idea a different API for every type started feeling stranger than adding a shared capability."
series:
main_image:
canonical_url:
---

You add `Maybe` to a language.

Then Array.

Then Either.

Then Signal.

And eventually the same operation keeps showing up:

**map**.

Apply a function to the value inside while preserving the outer shape.

I could have kept adding APIs like:

```text
maybeMap
arrayMap
eitherMap
signalMap
```

That would work.

It also started to bother me.

If the operation means the same thing, why should the caller need a different name every time?

## Mainstream languages give several perfectly reasonable answers

In TypeScript, per-type methods are completely normal:

```ts
values.map(double)
```

A library can give `Maybe` its own `.map`, and users can happily learn the common convention without the language having one global abstraction for all mappable types.

Python has protocols and special methods, but a Haskell-style `Functor` abstraction is not the center of ordinary Python programming.

Go often chooses the simpler route of concrete functions over introducing a broad abstraction just because two APIs look similar.

Rust has traits, so shared capabilities are already a first-class idea, but expressing Haskell-style higher-kinded `Functor` directly is not the same shape as in Seseragi.

Haskell, on the other hand, puts this idea right in the middle of the language ecosystem:

```haskell
fmap :: Functor f => (a -> b) -> f a -> f b
```

Seseragi eventually ended up looking much closer to that world.

But the starting point was not:

> I want Haskell type classes.

It was much less ambitious:

> I don't want `maybeMap`, `arrayMap`, and `signalMap` to feel like unrelated operations.

## I wanted to say: this type supports this operation

Seseragi has `trait` and `instance`.

A deliberately small Tour example looks like this:

```rust
trait Label<A> {
  fn label value: A -> String
}

type Badge =
  | Active

instance Label<Badge> {
  fn label value: Badge -> String = match value {
    Active -> "ACTIVE"
  }
}

pub effect fn main = label Active |> println
```

The interesting part is not the `Badge` example itself.

It is the relationship:

```text
Label describes a capability
Badge provides an instance of that capability
```

`Badge` does not suddenly become an object carrying a runtime `label` method.

The instance is selected from type information.

The call site still looks like ordinary function application:

```rust
label Active
```

I like that separation.

Data remains data.

A reusable capability is described separately.

Using the capability still feels like calling a normal function.

## `map` is where this becomes more than API naming

A Functor trait in Seseragi can be written like this:

```rust
trait Functor<F<_>> {
  fn map<A, B>
    f: (A -> B) -> value: F<A> -> F<B>
}
```

A Maybe instance can then say how that same operation works for `Maybe`:

```rust
instance Functor<Maybe> {
  fn map<A, B>
    f: (A -> B) -> value: Maybe<A> -> Maybe<B> =
    match value {
      Nothing -> Nothing
      Just item -> Just (f item)
    }
}
```

And the caller writes:

```rust
map double (Just 21)
```

There is no `maybeMap` in the source just because the value happens to be Maybe.

The type tells the compiler which instance is required.

## If this were only about a prettier API, modules would be enough

I could stop here and say:

```text
Maybe.map
Array.map
Either.map
```

is perfectly readable.

And it is.

The real reason a shared trait becomes useful is generic code:

```rust
fn transform<F<_>, A, B>
  f: (A -> B) -> value: F<A> -> F<B>
where Functor<F> =
  map f value
```

This function does not know whether `F` is Maybe, Array, List, or something user-defined.

It only knows one thing:

**`F` provides Functor.**

Now the abstraction is not merely making APIs look consistent.

It is letting code depend on a capability instead of a concrete type.

That is the point where the type-class machinery starts earning its complexity.

## HKT arrived because Functor needs the outer shape

Of course, `F<A>` introduces another problem.

An ordinary type parameter such as `A` stands for a complete type.

Functor needs to abstract over something that still expects a payload type:

```text
Maybe<_>
Array<_>
Either<E, _>
```

That is why Seseragi ended up with type-constructor parameters such as:

```text
F<_>
```

I wrote about that path separately:

https://dev.to/kentaromorishita/at-some-point-i-wanted-to-pass-a-type-constructor-around-like-a-type

The funny part is that HKT did not arrive because I wanted an advanced type-system feature on the checklist.

It arrived because one shared `map` needed an honest type.

## An instance is not a method table attached to the value

This distinction matters to how Seseragi feels.

When I write:

```rust
instance Label<Badge> { ... }
```

I am not asking the runtime value to grow another property.

The compiler resolves evidence for the trait instance from the type.

So generic code can say:

```rust
where Label<A>
```

without knowing which concrete implementation will eventually satisfy it.

This is much closer to Haskell type-class dictionaries or compile-time trait evidence than to dynamic object dispatch.

I wanted that semantic separation while keeping function application itself ordinary.

## But if I call everything an instance, every source of evidence has to behave the same

This is where the nice abstraction hit the implementation.

Seseragi can define user instances.

For example, a user-defined `Eq<Status>` can satisfy a generic function requiring:

```rust
where Eq<A>
```

That works.

But I found a much more embarrassing case with the standard `Int` equality instance.

A function like:

```rust
fn member<A>
  target: A -> values: List<A> -> Bool
where Eq<A> =
  any (\value: A -> value == target) values
```

could work with a user-defined ADT instance while failing when called with `Int`, even though ordinary integer equality already worked elsewhere.

Why?

Because some standard equality behavior was living on a dedicated operator path instead of being materialized as the same first-class trait evidence used by generic calls.

That gap is tracked in:

https://github.com/KentaroMorishita/seseragi/issues/394

As of this draft, #394 is still open.

## `1 == 1` working is not enough if `Eq<Int>` is supposed to exist

This bug made the contract much clearer to me.

From a user's point of view, these are supposed to belong to one semantic world:

```text
x == y
Eq.eq x y
generic where Eq<A>
```

If the first form works through an operator-specific special case but the third says no `Eq<Int>` instance exists, the abstraction is lying.

The compiler may optimize standard operators however it wants internally.

But language semantics should still say there is one `Eq<Int>` capability.

So #394 is not just an integer bug.

It audits standard Prelude instances across equality, arithmetic, Show/Debug, Functor/Applicative/Monad, collection traits, JSON traits, conditional/structural evidence, and module boundaries.

The goal is to make standard, local, imported, derived, and structural instances converge on the same evidence contract.

## The Prelude registry has the same single-source-of-truth problem

Once standard traits and instances grow, another danger appears.

You can end up with:

```text
one table for operators
another table for type-class resolution
another public Prelude artifact
another list used by Reference / completion
```

and they slowly stop agreeing.

Seseragi currently has an open issue for that too:

https://github.com/KentaroMorishita/seseragi/issues/329

#329 is about making the standard Prelude trait/method/instance registry canonical instead of maintaining several partially overlapping truths.

This sounds like boring compiler plumbing compared with Functor.

It is also what makes Functor actually trustworthy once the language is larger than a toy.

## A shared abstraction forces the compiler to prove it is really shared

This is probably the most interesting part of the whole feature to me.

At first the thought was:

> Why do I need a different `map` name for every type?

Then it became:

```text
same operation
↓
same trait
↓
same instance selection
↓
same evidence representation
↓
same module behavior
↓
same Prelude registry
```

Once you introduce one abstraction, every internal shortcut that secretly treats one type differently becomes much more visible.

That is painful.

It is also useful.

The abstraction becomes a test of whether the language implementation actually has the unity the syntax claims it has.

## Try the small trait example before thinking about Functor

The Tour is here:

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Start with the simple `Label<Badge>` example.

The important thing to notice is that the call remains:

```rust
label Active
```

Then imagine another type with its own `Label` instance.

The function name stays the same because the capability stays the same.

That is the whole motivation in miniature.

Functor, HKT, evidence dictionaries, and Prelude registries all came later.

The original discomfort was tiny:

**If `map` means the same thing, I want to keep calling it `map`.**

Apparently making that sentence true all the way through a compiler is the hard part.