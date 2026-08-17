---
title: "A Language's Personality Might Show Up More in What It Refuses to Add"
published: false
tags: programming, languages, design, seseragi
description: "match, HKT, Effect, Signal, custom operators: the feature list is long. But the choices that feel most Seseragi-like may be return, null, general assignment, and other things I left out."
series:
main_image:
canonical_url:
---

When you build a programming language, it is very easy to talk only about what you added.

Seseragi has:

- algebraic data types
- pattern matching
- higher-kinded types
- custom operators
- Effect
- Signal
- Functor / Applicative / Monad

The feature list keeps getting more impressive-looking.

Lately, though, I have started wondering whether that list says less about the language than the things I deliberately **did not** add.

Maybe a language's personality shows up more clearly in its omissions.

## Seseragi looks like several languages depending on where you stare

There are Haskell-looking operators:

```rust
f <$> value
f <*> value
```

There are Rust/ML-looking ADTs and matching:

```rust
type Status =
  | Ready
  | Waiting

fn label status: Status -> String = match status {
  Ready -> "ready"
  Waiting -> "waiting"
}
```

There are Structs and `impl`.

There are braces and imports that can feel familiar to a TypeScript developer.

The pipeline operator may remind someone of F#.

The funny thing is that I have never used F#.

I have touched Haskell and Rust, but not as the center of my professional career either.

A lot of the resemblance happened because I followed a problem until I reached an answer that other languages had already found.

That kind of convergence does not bother me.

What interests me more is which neighboring features I *didn't* bring along.

## Function calls do not have a separate argument-list world

A C-family language might write:

```text
add(1, 2)
```

Seseragi writes:

```rust
add 1 2
```

The function is applied to one value, then another.

That same rule continues even when there appears to be no argument.

Instead of inventing a special zero-argument call form such as:

```text
clock()
```

Seseragi treats a parameterless-looking function semantically as:

```text
Unit -> A
```

and calls it by applying the Unit value:

```rust
clock ()
```

`()` is not a magic call marker.

It is a value.

I wrote more about that here:

https://dev.to/kentaromorishita/what-if-a-zero-argument-function-actually-took-unit

The omission is small: no special zero-argument application rule.

But small omissions accumulate into a language's feel.

## There is no `return`

Seseragi blocks are expressions.

The final expression is the value of the block:

```rust
fn message name: String -> String = {
  let greeting = "hello"
  `${greeting}, ${name}`
}
```

So I did not add a general `return` statement just to say that the last value is the function result.

This was not originally a crusade against the keyword `return`.

I have written `return` in TypeScript, PHP, Python, and Go for years without distress.

But after making blocks produce values, `return` stopped solving a problem I still had.

The dedicated instruction became optional.

Once something becomes optional in a language design, you have to justify adding it back.

## There is no ordinary `null` value mixed into every type

If a User may be absent, Seseragi says so:

```text
Maybe<User>
```

The absence does not silently inhabit `User` itself.

Again, the motivation was not "null is morally bad."

I wanted this information to survive:

```text
this computation may produce no User
```

A nullable runtime convention tends to erase that fact unless the type system puts it back.

Seseragi starts with the fact visible.

That let me avoid adding one broadly inhabiting absence value to the ordinary value model.

## `try` / `catch` is not the center of failure handling

For a parsing operation, I can have:

```text
Either<ParseError, User>
```

For an operation that touches the outside world:

```text
Effect<R, HttpError, User>
```

The possibility of failure remains in the value/type being composed.

Of course the JavaScript or Rust host underneath Seseragi can throw or panic at integration boundaries.

The question is what Seseragi source should make application programmers reason about.

I did not want host exception mechanics to become the primary language-level error model merely because the current backend/runtime knows about them.

## There is no general mutable-variable model

This:

```rust
let count = 1
```

binds a value.

`count` does not later become 2.

UI still needs state that changes over time, so Seseragi has Signal.

A MutableSignal can be updated:

```rust
state := 42
```

but that syntax does not reassign the binding `state`.

It updates the current value of a reactive source.

I wrote about that distinction here:

https://dev.to/kentaromorishita/i-didnt-want-assignment-i-wanted-to-change-a-signals-current-value

This is a good example of omission not meaning incapability.

I did not remove change from the language.

I made change belong to a value whose type explicitly means "changes over time" instead of making every binding potentially mutable.

## Promise is not a Seseragi programming model

Seseragi targets TypeScript today, and Web I/O eventually becomes JavaScript runtime operations.

That does not mean a Seseragi programmer should have to think in terms of:

```text
Promise
async
await
AbortController
```

whenever they want to perform HTTP.

Those are useful JavaScript concepts.

They are also backend/runtime concepts from Seseragi's point of view.

What I want visible at the Seseragi layer is closer to:

```text
this operation performs an external effect
it requires some capability/environment
it may fail with this error
it may produce this result
```

That is why Effect exists.

A backend detail should not automatically become a source-language abstraction.

## Inheritance is not the universal way to organize behavior

Seseragi has Records and Structs for data.

ADTs for alternatives.

`impl` for operations that belong specifically with a nominal type.

Traits/instances for shared capabilities.

I did not add class inheritance as the one mechanism expected to carry all of those concerns.

That is not because class-based programming has failed at building software. PHP, JavaScript, TypeScript, and many other ecosystems have built enormous systems with objects and classes.

I simply did not need inheritance to express the meanings Seseragi already had separate tools for.

So it stayed out.

## But "remove everything" would make the language worse too

This is the part that prevents omission from becoming a purity contest.

Seseragi still has `match`.

It has Struct.

It has `impl`.

It has `$` and `|>`.

It even has custom operators.

In theory, some of these could be encoded using fewer primitive mechanisms.

That does not mean removing them would improve the language.

If removing a feature also hides an important meaning, the smaller feature count is not a win.

ADT without a shape-aware `match` would be awkward.

Time-varying state flattened into ordinary mutation would lose useful meaning.

Effects flattened into Promise would expose the backend instead of the source-language contract.

## Signal not being Monad is my favorite example of intentional absence

Seseragi already has Monad infrastructure.

A dynamic Signal operation such as `switchMap` exists too.

So this was not an inability to implement the abstraction.

I simply decided the standard Signal type should expose Functor and Applicative but not Monad.

Why?

Because a Signal `flatMap` would imply dynamic subscription switching and lifetime/dependency-graph semantics.

That is useful, but heavy enough that I prefer an explicit named operation rather than presenting it as the ordinary generic composition of Signal.

I wrote the full reasoning here:

https://dev.to/kentaromorishita/i-deliberately-did-not-make-signal-a-monad

This is an omission made **after** the capability was available.

That makes it a useful design test:

```text
Can I implement this?
```

is not the same question as:

```text
Should this be part of the type's standard meaning?
```

## This is why a feature list can make Seseragi look like a pile of influences

If you only list additions:

```text
ADT
match
HKT
Functor
Applicative
Monad
Effect
Signal
struct
impl
custom operators
```

it can look like I walked through several languages and collected interesting features.

But if you list the omissions beside them:

```text
no special call syntax for zero arguments
no return statement
no ordinary null
no general mutable variable
no Promise-shaped source model
no class-inheritance center
no standard Signal Monad
```

a more consistent direction appears.

The point is not "remove familiar things because minimalism is virtuous."

The recurring questions are closer to:

```text
Does this need a special rule?
Can an ordinary value/function/type already express it?
Would removing this feature erase important meaning?
Is this host-runtime machinery or source-language meaning?
```

## Go and Seseragi can share an instinct and reach opposite-looking languages

I sympathize a lot with Go's preference for not multiplying language concepts unnecessarily.

Seseragi obviously does not look like Go.

It has HKT and type classes. Go very deliberately does not go there.

The shared instinct is not the resulting feature list.

It is the suspicion of adding machinery without a semantic payoff.

Go often gets simplicity by keeping abstractions out.

Seseragi sometimes gets a simple surface by putting a more sophisticated abstraction underneath.

Same desire: code that remains understandable.

Different answer about where complexity should live.

## Language design has started feeling more like subtraction than accumulation

Early in the project, it was natural to think:

> What should I implement next to make the language stronger?

Now I more often catch myself asking:

> Does this belong in the language at all?
>
> Can the existing model already express it?
>
> If I remove it, do I lose meaning or only ceremony?

Adding a feature is a design decision.

Refusing one is too.

And when I read Seseragi code now, I suspect the second category tells me more about what the language values.

https://github.com/KentaroMorishita/seseragi

https://seseragi.vercel.app/

A language is partly the set of programs it lets you write.

It is also the set of concepts it decides you **do not need to carry around while writing them**.