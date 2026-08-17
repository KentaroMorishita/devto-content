---
title: "I Didn't Add Generics Because I Wanted to Write <T>"
published: false
tags: programming, types, generics, seseragi
description: "The syntax was never the interesting part. I just got tired of writing the same function twice because the concrete type changed."
series:
main_image:
canonical_url:
---

When a typed language grows, generics show up very early.

Not because angle brackets are irresistible.

Because this starts looking ridiculous:

```rust
fn keepInt value: Int -> Int = value
fn keepString value: String -> String = value
```

The implementation is identical.

Only the concrete type changed.

At some point the natural reaction is:

**Why am I writing this twice?**

So Seseragi can write:

```rust
fn keep<A> value: A -> A = value
```

That is the reason I wanted generics.

Not because a programming language looks more serious once it has `<A>`.

## The notation is not the feature

When people say "generics," the first image is often something like:

```text
List<T>
Array<T>
Map<K, V>
```

Seseragi has type parameters too.

But what matters is the relationship they let the type preserve.

For `keep`:

```text
A -> A
```

I do not know what `A` is.

I do know that the input and output must be the same type.

That relationship is the useful information.

The current Tour teaches it from exactly this kind of duplication:

```rust
fn keepInt value: Int -> Int = value
fn keepString value: String -> String = value

fn keep<A> value: A -> A = value

pub effect fn main = do {
  println `concrete: ${keepInt 42}`
  println `generic: ${keep (keepString "Seseragi")}`
}
```

https://seseragi.vercel.app/tour/

I prefer that route over opening with "parametric polymorphism."

First notice the duplicated function.

Then remove the unnecessary knowledge.

## TypeScript, Rust, Go, and Haskell all look different here

TypeScript:

```ts
const keep = <T>(value: T): T => value
```

Rust:

```rust
fn keep<T>(value: T) -> T {
    value
}
```

Go:

```go
func keep[T any](value T) T {
    return value
}
```

Haskell:

```haskell
keep :: a -> a
keep value = value
```

The syntax varies a lot.

The useful statement is almost identical:

```text
I do not need to know the concrete type.
I only need to preserve the relationship between occurrences of that type.
```

That is why I do not find syntax-only comparisons very interesting here.

The angle brackets are surface detail.

The real feature is the ability to say what the function **does not need to know**.

## Generics are partly about deleting information

That phrasing helped me understand why I like them.

Consider:

```rust
fn first<A> pair: (A, A) -> A =
  match pair {
    (left, _) -> left
  }
```

This function does not care whether the values are `Int`, `String`, `User`, or something I have not invented yet.

The concrete type is irrelevant to the algorithm.

So the type should not force me to choose one.

What remains is only the information the function actually uses:

```text
both elements have the same type A
and the result is also A
```

That is a surprisingly nice way to think about abstraction.

Not "make the function more general" first.

More like:

**Remove facts the implementation never needed.**

## Of course, generic does not mean omnipotent

Then you write this:

```rust
fn same<A> left: A -> right: A -> Bool =
  left == right
```

and the type checker has a reasonable question:

> Why do you think every possible `A` supports equality?

Simply naming a type parameter does not grant operations on it.

So the next step becomes a constraint:

```rust
fn same<A> left: A -> right: A -> Bool
where Eq<A> =
  left == right
```

Now the function still does not know the concrete type.

But it does know one capability is available.

The progression becomes:

```text
I do not care what the type is
↓
but I do require this ability
```

That naturally leads into traits/type classes and instance resolution.

Generics were the doorway.

## Constraint systems expose each language's personality

TypeScript often expresses a requirement structurally:

```ts
function showName<T extends { name: string }>(value: T) {
  return value.name
}
```

The requirement is about shape.

Rust uses trait bounds.

Haskell uses type class constraints.

Go uses interfaces and type sets.

Seseragi's:

```rust
where Eq<A>
```

leans toward the "this capability requires evidence" side of Rust/Haskell.

But I still wanted structural Record typing elsewhere.

Those are different questions:

```text
Does this value have this shape?
```

versus:

```text
Does this type provide this capability?
```

Trying to make one mechanism answer both would have erased a distinction I actually wanted.

## The Tour deliberately starts with duplication, not theory

The generic/Trait Tour work was tracked in #178:

https://github.com/KentaroMorishita/seseragi/issues/178

That issue is now closed as completed.

Its learning order is important to me.

It starts with concrete functions, then type parameters, then generic ADTs, constraints, instances, and eventually `F<_>`, `<$>`, `<*>`, and `>>=`.

The goal was specifically **not** to drop every abstraction on the reader at once.

If someone can look at:

```rust
fn keepInt value: Int -> Int = value
fn keepString value: String -> String = value
```

and say:

> These are the same function.

then the motivation for `A` is already there.

The terminology can arrive later.

## The compiler story is much less small than the source syntax

From the user's side:

```rust
fn keep<A> value: A -> A = value
```

looks tiny.

From the compiler side, `A` has to survive.

It has to remain the same type parameter through parsing, resolution, typed representations, public module interfaces, intermediate representations, and backend lowering.

Then constraints have to survive beside it.

And once Seseragi supports type-constructor parameters such as:

```text
F<_>
```

the compiler has to remember not only the parameter name, but its kind/arity.

A bug in that exact area became Issue #196:

https://github.com/KentaroMorishita/seseragi/issues/196

The problem was that some declaration paths preserved generic/HKT metadata while others silently collapsed or dropped it across Typed HIR, interfaces, Core IR, or TypeScript lowering.

That issue has since been completed.

What I like about the bug is what it reveals:

**A generic parameter is not a decorative name in the parser. It is semantic identity that has to survive the whole compiler.**

## Local code working is not enough

One of the easiest ways to fake generic support is to make a local example type-check.

But Seseragi is a module language.

A public generic declaration has to cross module boundaries without changing meaning.

If:

```text
F<_>
```

turns into a plain value-type parameter after serialization, or a `where` constraint disappears from the public interface, then the source syntax lied.

That was the core concern in #196.

The fix was not supposed to special-case `Maybe`, `Either`, or some standard type.

It had to keep generic parameter kind and constraint metadata consistent across declaration kinds and import/export boundaries.

Again, the surface looks like one letter.

The implementation is a contract that letter has to keep everywhere.

## Generic types quickly spread through the whole language

Once `A` is ordinary, you start seeing shapes like:

```text
Array<A>
Maybe<A>
Either<E, A>
Signal<A>
Html<Action>
```

The language begins to talk less about concrete data and more about relationships between containers and payloads.

Then eventually this question appears:

```text
Can I parameterize over the container itself?
```

Which leads to:

```text
F<_>
```

and higher-kinded types.

That sounds like a huge jump when described from the destination.

From the beginning, the path was much less dramatic:

```rust
fn keepInt value: Int -> Int = value
fn keepString value: String -> String = value
```

I looked at two identical function bodies and thought:

**One should be enough.**

A surprising amount of type-system architecture grew out of that sentence.

## Try making `keep` concrete again

The Playground and Tour are here:

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Start with:

```rust
fn keep<A> value: A -> A = value
```

Use it with both an `Int` and a `String`.

Then replace `A` with `Int` and watch what disappears from the set of valid calls.

That difference is the entire feature in miniature.

Generics are often introduced as a big type-system topic.

For me, the useful feeling is simpler:

**If the implementation does not care which concrete type it received, the source should not have to pretend that it does.**