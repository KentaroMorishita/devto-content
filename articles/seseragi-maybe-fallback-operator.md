---
title: "I Wanted ?? for Maybe. Then the Compiler Made It Complicated."
published: false
tags: programming, types, javascript, seseragi
description: "The syntax looks like JavaScript's nullish coalescing. The semantics are very different: typed Maybe, right associativity, and real short-circuit evaluation."
series:
main_image:
canonical_url:
---

Once you use `Maybe<A>` as an ordinary type, one operation appears constantly:

Use the value if it exists.

Otherwise use a fallback.

I can always write a `match`:

```rust
match name {
  Just value -> value
  Nothing -> "anonymous"
}
```

That is explicit and fine.

It is also a lot of ceremony for one of the most common things you do with an optional value.

So at some point my reaction was very simple:

**Maybe needs `??`.**

I had already decided that absence in Seseragi should stay visible in the type rather than flowing around as `null`:

https://dev.to/kentaromorishita/why-does-null-get-to-pretend-its-a-normal-value-2cpj

Once `Maybe` became normal, a short fallback surface started feeling normal too.

## The specification already says what `??` means

Seseragi defines `??` as a built-in Maybe fallback operator.

The canonical shape is:

```rust
let displayName =
  cachedName ?? requestedName ?? "anonymous"
```

It associates to the right:

```text
cachedName ?? (requestedName ?? "anonymous")
```

If `cachedName` and `requestedName` are `Maybe<String>`, the final result is a plain `String`.

The type of one fallback step is intentionally small:

```text
Maybe<A> ?? A -> A
```

If the left side is `Just value`, return `value`.

If it is `Nothing`, evaluate and return the fallback.

That sounds almost too small to deserve an article.

Then I tried to connect it to the compiler.

## Yes, it looks exactly like JavaScript's `??`

That is deliberate.

In JavaScript and TypeScript:

```ts
const displayName = cachedName ?? requestedName ?? "anonymous"
```

means: take the left value unless it is `null` or `undefined`, otherwise move right.

I have written Web code for a long time, so that reading is already automatic for me.

Using the same symbol in Seseragi felt immediately readable.

But the language meaning is not copied wholesale from JavaScript.

Seseragi does not define `??` over arbitrary nullable runtime values.

The left operand is specifically:

```text
Maybe<A>
```

The right operand is:

```text
A
```

The result is:

```text
A
```

So the familiar surface is sitting on top of a very different model of absence.

JavaScript says:

```text
value may be nullish at runtime
```

Seseragi says:

```text
this expression is explicitly Maybe<A>
```

Same punctuation.

Different thing being represented.

I like that distinction because syntax can be familiar without forcing the rest of the type model to be familiar too.

## Rust makes the eager/lazy fallback distinction explicit

Rust's `Option<T>` has methods such as:

```rust
let value = maybe.unwrap_or(fallback);
```

and, when constructing the fallback is expensive:

```rust
let value = maybe.unwrap_or_else(|| expensive_fallback());
```

That split is useful because `unwrap_or` receives an already evaluated value, while `unwrap_or_else` receives a closure that can be called only when needed.

Looking at that makes the important part of Seseragi's `??` obvious.

This:

```rust
value ?? expensiveFallback
```

must not eagerly evaluate `expensiveFallback` when `value` is already `Just`.

The operator itself carries short-circuit semantics.

That means:

```text
Just x ?? fallback
```

should evaluate the left side once, skip the fallback entirely, and produce `x`.

While:

```text
Nothing ?? fallback
```

should evaluate the fallback exactly once.

That is not just API design anymore.

It is evaluation strategy.

## Haskell makes the same question feel different again

Haskell is lazy by default, so "is the fallback evaluated?" lives in a different semantic landscape.

That is what I find interesting about a feature this small.

Every language can offer "use this value, otherwise use that one."

But the natural API depends on what the language already assumes about evaluation.

Rust distinguishes eager and lazy APIs explicitly.

JavaScript builds short-circuiting into `??`.

Haskell starts from lazy evaluation.

Seseragi is strict, but gives this specific operator short-circuit behavior.

The visible syntax may be one line.

The design is attached to the whole evaluation model underneath it.

## Why right associativity matters

Consider:

```rust
cachedName ?? requestedName ?? "anonymous"
```

The intended reading is:

```text
cachedName ?? (requestedName ?? "anonymous")
```

The inner expression:

```text
requestedName ?? "anonymous"
```

takes a `Maybe<String>` and produces a `String`.

That plain `String` can then act as the fallback for `cachedName`.

The type progression fits the right-associative syntax naturally.

If `??` were left-associative, the first step would already produce `String`, and then the next `??` would no longer have a `Maybe` on the left.

So associativity is not just a style decision here.

It follows directly from the operator's type.

## Python's `or` looks similar until an empty string appears

Python can write:

```python
name = cached_name or "anonymous"
```

That often behaves like fallback syntax.

But it is based on truthiness, not absence.

An empty string also falls through:

```python
"" or "anonymous"
```

produces the fallback.

That is a different operation.

Maybe fallback should distinguish:

```text
Just ""
```

from:

```text
Nothing
```

The first one contains a value, even if that value happens to be empty.

Again, the concise syntax only works because the language can say exactly what kind of absence it is handling.

## Go's answer is often: just write the branch

Go frequently represents absence through `nil` or `value, ok`, and an explicit `if` is a perfectly normal answer.

I understand that approach too.

Not every recurring operation deserves an operator.

In Seseragi, I decided `Maybe` would be common enough that its simplest fallback pattern deserved a tiny surface.

That is the threshold for me.

Not "can I invent syntax for this?"

More like:

**Will I read this operation so often that the shorter shape becomes clearer than repeating the branch?**

For Maybe fallback, I think the answer is yes.

## And right now, `??` still does not work

This is where the story gets very Seseragi.

The specification defines `??`.

The symbol is reserved.

Userland is not allowed to define a custom `??`.

But the current compiler still does not have the built-in operator wired into normal expression resolution.

So the reservation is there.

The actual guest is not.

That gap is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/343

As of this draft, #343 is still open.

The issue is not simply "recognize two question marks."

It includes:

- precedence 0
- right associativity
- `Maybe<A> ?? A -> A` typing
- expected-type propagation
- lazy right-hand lowering
- observable short-circuit behavior
- formatting
- analysis and reference surfaces
- stable diagnostics

A two-character operator manages to visit almost the entire compiler.

## I cannot even prototype the real thing as a custom operator

Seseragi supports user-defined infix operators.

So for many operations I can prototype a surface in userland before deciding whether the compiler needs to know about it.

`??` is different for two reasons.

First, the symbol is reserved.

Second, even if I used another symbol, a normal custom operator is just a function-like operation.

It receives its operands according to ordinary evaluation rules.

That cannot faithfully model:

```text
if the left side is Just, do not evaluate the right side at all
```

The short-circuit is the feature.

That is the boundary where "operators are functions with funny names" stops being enough.

## Custom operators actually made the built-in boundary clearer

Seseragi's current operator model distinguishes ordinary user-defined infix operators from operators whose evaluation strategy is part of the language contract.

The specification allows custom operators such as:

```rust
pub operator<A> infixr 5 <+>
  left: A -> right: A -> A
where Semigroup<A> =
  append left right
```

and defines them as ordinary curried function-like values with fixity information.

But `??` is reserved, just like other special surfaces whose semantics cannot be reproduced by eager function application.

The operator specification says `&&`, `||`, and `??` short-circuit.

That gave me a useful dividing line:

```text
operator meaning = ordinary function application
  -> userland can own it

operator meaning includes evaluation control
  -> language must own it
```

I did not start with that boundary perfectly articulated.

Actually using the custom-operator system is what made it obvious.

## `match` still has a job

I do not want `??` to replace pattern matching.

If the two cases do different work, `match` is exactly what I want:

```rust
match name {
  Just value -> ...
  Nothing -> ...
}
```

`??` is for the boring case.

The left value exists? Use it.

It does not? Use this fallback.

The operation is so regular that a dedicated operator lets the interesting code remain visible around it.

## This article currently contains specification examples, not Playground examples

That distinction matters.

While #343 remains open, this is **not** something you can paste into the current Playground and expect to run:

```rust
cachedName ?? requestedName ?? "anonymous"
```

The Tour and Playground are here:

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Eventually I expect `??` to become one of those features I stop thinking about completely.

That is probably the ideal outcome.

Right now the sequence is funnier:

```text
I want this
↓
the spec already has it
↓
the symbol is already reserved
↓
the compiler implementation is missing
```

So I am writing about it before it becomes boring.

Once it works, `cachedName ?? "anonymous"` will just look obvious.

Getting to "obvious" is apparently the part that takes the compiler work.