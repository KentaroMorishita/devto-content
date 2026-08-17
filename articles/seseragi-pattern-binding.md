---
title: "If Patterns Can Deconstruct Values in match, Why Stop There?"
published: false
tags: programming, types, patternmatching, seseragi
description: "I wanted lightweight destructuring. It turned into a question about whether pattern binding was really one semantic feature across the whole language."
series:
main_image:
canonical_url:
---

Seseragi uses algebraic data types and `match` quite heavily.

So patterns were inevitable.

For example:

```rust
match delivery {
  Preparing -> "Preparing your order"
  Shipped city -> `Shipped to ${city}`
}
```

The constructor tells me the shape of the value, and the pattern gives names to the pieces inside it.

That felt natural.

I had already written about why I prefer matching the shape of state over chasing control flow through `if` chains:

https://dev.to/kentaromorishita/i-tried-to-eliminate-if-i-ended-up-putting-match-in-my-language-41b6

But once patterns existed, another question started bothering me:

**Why should value decomposition only happen inside `match`?**

## If I have a tuple, I want to receive it as a tuple

Suppose I have:

```rust
let route: (String, Int) = ("Osaka", 2)
```

I want the city and the number of stops.

I could invent tuple accessors.

I could use indexes.

But I already know the shape of the value.

So Seseragi lets me write:

```rust
let (city, stops) = route
```

That is it.

```rust
let route: (String, Int) = ("Osaka", 2)
let (city, stops) = route

pub effect fn main =
  println $ `${city}: ${stops} stops`
```

This is not an impressive feature.

I like it anyway.

Small features that remove pointless extraction steps tend to make the whole language feel better.

## JavaScript destructuring was already doing something I liked

I have used JavaScript and TypeScript destructuring for years:

```ts
const [city, stops] = route
const { name, age } = user
```

That syntax is extremely convenient.

You receive a value and name its parts in one place instead of writing:

```ts
const city = route[0]
const stops = route[1]
```

So yes, I wanted destructuring in Seseragi.

But I did not want to add separate ideas called "tuple destructuring," "record destructuring," and "ADT pattern matching" if they were all expressions of the same underlying thing.

Seseragi already had patterns for `match`.

Could binding use the same language?

That question ended up being more important than the surface syntax.

## Rust and Haskell show what happens when patterns live everywhere

Rust uses patterns in `match`, but also in `let`:

```rust
let (city, stops) = route;
```

Enum payloads are destructured through patterns too.

Haskell also lets patterns appear in bindings, function arguments, `case`, and other places.

The useful idea is not:

```text
patterns are a feature of match
```

It is closer to:

```text
patterns are a common language for receiving values by shape
```

That is the model I found attractive.

Python has assignment unpacking and structural pattern matching, but they come from different parts of the language's history.

TypeScript has excellent array and object destructuring, but no built-in ADT constructor pattern matching in the same sense.

All of these choices are practical.

Seseragi already leans heavily on ADTs, so once constructor patterns existed, I preferred to make binding surfaces speak the same language where possible.

## The pattern should resemble the value

For a tuple:

```rust
let route: (String, Int) = ("Osaka", 2)
let (city, stops) = route
```

For an ADT:

```rust
type Delivery =
  | Preparing
  | Shipped String

fn message delivery: Delivery -> String = match delivery {
  Preparing -> "Preparing your order"
  Shipped city -> `Shipped to ${city}`
}
```

The operations look different because the surrounding constructs are different.

But the pattern itself is doing the same conceptual job:

**This value has this shape. Put names here.**

I like code where the shape of the value and the shape of the binding stay close.

It avoids the little intermediate dance of receiving a whole object, then asking for each piece one at a time.

## Then I spread patterns across the language and discovered they were not actually unified

This is where the nice design story turns into a compiler story.

Patterns eventually appeared in several places:

```text
let
match
Effect do
Monad do
<-
comprehension
effectful for
```

From the language-design side, that looked consistent.

From the implementation side, some of those surfaces had different parser and typing paths.

And then normal code started exposing the differences.

For example, this nested pattern failed through one path:

```rust
match result {
  Just (User (name, age)) ->
    `${name}: ${age}`
}
```

A typed `let` inside `do` failed through another:

```rust
pub effect fn main = do {
  let missingName: Maybe<String> = Nothing
  ...
}
```

At first glance, it is tempting to call that a `Maybe` bug.

That would have been a bad diagnosis.

If the same thing breaks for `Either<String, A>` next week, and then for a user-defined `Box<A>`, the problem is not `Maybe`.

The problem is that the language claims pattern binding is one feature while the compiler still has multiple half-independent interpretations of it.

That became Issue #194:

https://github.com/KentaroMorishita/seseragi/issues/194

## The real matrix was larger than I expected

Once I wrote the issue down properly, the size of the problem became obvious.

There were two dimensions.

First, the **binding surface**:

```text
top-level let
block-local let
Effect do let
Monad do let
Effect / Monad <-
match arm
comprehension
effectful for
```

Second, the **pattern and input type**:

```text
name / wildcard
tuple
record
struct
Array / List / rest
constructor / newtype
nested constructor
Maybe<A>
Either<E, A>
partially applied type constructors
user-defined generic ADTs
```

I did not want to implement the full Cartesian product as a giant pile of special cases.

The goal was the opposite:

**Derive binding types recursively from the input type using one pattern semantics, regardless of the constructor's name.**

That sounds obvious after writing it down.

It was not obvious while the feature was growing one surface at a time.

## Even parentheses became part of pattern semantics

One of the implementation differences found in #194 was surprisingly small.

This looks completely ordinary:

```rust
Just (User (name, age))
```

But a parser has to decide what those parentheses mean.

Are they a tuple pattern?

Are they grouping around one nested pattern?

If the pattern parser only understands parentheses as "a tuple with commas," then a single grouped nested pattern can fail even though the equivalent expression syntax would feel obvious to a user.

So suddenly this question:

> Why can't I destructure a tuple in `let`?

had grown into:

- parser behavior
- grouped patterns
- expected types
- nested constructor typing
- scope registration
- Typed HIR
- analysis / LSP
- lowering
- execution tests

Language implementation has a wonderful ability to punish the phrase "this should be simple."

## #194 is closed now, and the fix matters because it was generic

The regression issue has since been completed.

The completion work unified typed `do let` with the shared pattern-binding helper, treated `(pattern)` as grouping, and verified nested patterns across standard `Maybe`, partial `Either`, and imported user-defined generic ADTs.

The important part is what it **didn't** do.

It did not add branches like:

```text
if this is Maybe, do this
if this is Either, do this
if this is Box, do this
```

That would have made the examples pass while leaving the semantic split in place.

Instead, the fix was tested through different type constructors precisely to prove that the pattern machinery was constructor-name independent.

The issue's completion note also recorded actual execution through Playground/WASM paths, not just an internal type-checking fixture.

That is the kind of fix I want in a language compiler: repair the shared meaning, not the screenshot that happened to reveal the bug.

## A tiny convenience became infrastructure

What I find funny is where this started.

Not with a grand plan for a generalized pattern calculus.

It started with:

```rust
let (city, stops) = route
```

I just did not want to pull two values out one by one.

But once that syntax exists, users reasonably expect the same pattern language to work in other places.

Then the compiler has to make that expectation true.

This is one of the most interesting things about language design for me:

**A small ergonomic feature can quietly become foundational semantics.**

You only find out after several other features start depending on it.

## Patterns stop looking like a `match` feature

Once patterns work across the language, I stop thinking of them primarily as "pattern matching."

They become the language I use when a value enters a scope.

I may want to:

- split a tuple
- receive constructor payloads
- unpack nested shapes
- ignore pieces with a wildcard
- bind values inside `do`
- bind generator values inside a comprehension

`match` is one important place where that happens, but not the only one.

That shift in perspective makes the feature feel much more coherent.

Instead of many destructuring syntaxes, the language has one idea:

**Read the shape of the value.**

## Try breaking the shape in the Playground

The simple Tour example is:

```rust
let route: (String, Int) = ("Osaka", 2)
let (city, stops) = route

pub effect fn main =
  println $ `${city}: ${stops} stops`
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Now change the value to a triple:

```rust
let route: (String, Int, Bool) =
  ("Osaka", 2, True)
```

and leave the pattern as:

```rust
let (city, stops) = route
```

The shapes no longer match, so the compiler has something concrete to complain about.

Then make the pattern a triple too.

What I like about the mental model is that I am not asking for "tuple element 0" and "tuple element 1."

I am putting a pattern against a value and saying:

**I expect it to look like this.**

Once `let` and `match` share that idea, they start to look like different uses of the same language rather than unrelated features.