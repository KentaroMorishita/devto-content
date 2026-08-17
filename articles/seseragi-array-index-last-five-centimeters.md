---
title: "I Tried to Index an Array. Everything Except array[index] Was Already There."
published: false
tags: programming, types, rust, seseragi
description: "The type semantics existed. The runtime path existed. std/array.get worked. The spec even documented array[index]. The only missing piece was the syntax itself."
series:
main_image:
canonical_url:
---

I was playing with an `Array` in the Seseragi Playground.

```rust
let hoge = [x | x <- 1..10]
```

I wanted the second value.

Seseragi is supposed to make array indexing safe by default, so:

```rust
hoge[1]
```

should not return `Int` directly.

Its type should be:

```text
Maybe<Int>
```

If the index is out of bounds, the result should be `Nothing`.

That fits the same design I use elsewhere: absence should be an ordinary value that the type system can see, not a hidden exceptional path.

I wrote about that more generally here:

https://dev.to/kentaromorishita/why-does-null-get-to-pretend-its-a-normal-value-2cpj

So I wrote the obvious code:

```rust
pub effect fn main =
  println $ match hoge[1] {
    Just value -> value
    Nothing -> 0
  }
```

It did not work.

Why.

## But std/array.get already worked

The standard array API already had `get`.

```rust
import * as arrays from "std/array"

let hoge = [x | x <- 1..10]

pub effect fn main =
  println $ match arrays.get 1 hoge {
    Just value -> value
    Nothing -> 0
  }
```

That worked in the Playground.

The output was:

```text
2
```

So I started checking what actually existed.

- `Array` existed.
- Safe random-access semantics existed.
- The result type was already `Maybe<A>`.
- The runtime path already existed.
- The specification already described `array[index]`.
- The Tour even talked about array access.

And yet:

**the square-bracket surface itself was missing.**

This is the kind of bug that annoys me more than a feature being completely absent.

The language had almost every piece of the idea.

The last wire was just not connected.

## Array indexing is a tiny syntax with a lot of language philosophy inside it

Once I hit the bug, I started thinking again about how different languages answer the same question.

In JavaScript:

```ts
const values = [10, 20, 30]
values[99] // undefined
```

TypeScript's static view depends on configuration. With ordinary settings, indexed access often behaves as if the element is there. With `noUncheckedIndexedAccess`, `undefined` becomes visible in the type.

Python takes another route: an out-of-range access raises `IndexError`.

Go panics at runtime for an invalid index.

Rust is especially interesting because it exposes both choices:

```rust
values[1]
```

can panic when out of bounds, while:

```rust
values.get(1)
```

returns an `Option<&T>`.

The same data structure has both a convenient partial operation and an explicit safe operation.

Seseragi deliberately takes a different position:

```text
Array<A>[Int] -> Maybe<A>
```

The short, everyday indexing syntax itself is the safe operation.

That is one of those choices that looks small in the grammar and large in the programming model.

## I did not want the shortest syntax to be the dangerous one

Since `arrays.get 1 values` already existed, I could have made square brackets mean the unsafe version:

```text
values[1] -> A
```

and panic when the value is not there.

That would be a perfectly defensible language design.

But I did not like the asymmetry.

The syntax people will reach for first would be the one that hides failure, while the longer named function would be the one that exposes it.

Seseragi already treats `Maybe` as an ordinary type, so there was no need to invent a special array failure model.

If I write:

```rust
values[1]
```

and the result is `Maybe<A>`, I cannot accidentally forget that the value may not exist.

That is the whole point.

I like Rust's safe `get` API a lot.

Seseragi's answer is basically: **what if that safe choice were the default syntax?**

## Array and List should not pretend to have the same access model

The specification also says something else important:

`Array` gets index syntax.

`List` does not.

That is intentional.

A persistent linked list can absolutely provide a function that walks to the nth element. But giving it the same `list[5]` notation as an array makes the cost and structure look more similar than they really are.

This is one reason I kept `Array` and `List` as separate types in the first place.

An `Array` is the place where random access belongs naturally.

A `List` is much more naturally consumed through patterns, head/tail structure, and traversal.

So `array[index]` is not just convenience syntax.

It is one of the places where the difference between the two data structures becomes visible on the surface.

## Then I checked the Tour and got even more annoyed

Seseragi has a browser-based Tour.

https://seseragi.vercel.app/tour/

There was already a lesson whose learning target included array access.

But the sample was effectively using pattern matching to read the head:

```rust
fn describe values: Array<Int> -> String = match values {
  [] -> "empty"
  [head, ...tail] ->
    `head: ${head} / length: ${arrays.length values}`
}
```

That is not wrong code.

But it has the exact problem the language design was trying to avoid: it makes `Array` look a lot like `List` at the moment where I should be teaching their difference.

I remember looking at my own Tour and thinking:

**Then why did I make both types?**

If an Array lesson says "array access" but never shows random access, the abstraction is technically present and pedagogically invisible.

## The old TypeScript compiler had actually implemented indexing once

This got stranger when I looked into the project history.

The old TypeScript implementation had an issue for array and tuple index access that was already closed:

https://github.com/KentaroMorishita/seseragi/issues/37

So, at a feature-name level, I had already done this before.

But the semantics had changed since then.

The old implementation expected direct element access.

The current specification says:

```text
Array<A>[Int] -> Maybe<A>
```

That means I could not simply say, "restore the old feature."

The syntax name was the same, but the contract was not.

This is one of the less obvious hazards of rewriting a compiler.

A checklist can say:

```text
index access: done
```

while the current language means something different by "index access" than the old one did.

The feature name survives.

The semantics move underneath it.

## The Rust rewrite dropped the final surface connection

The current issue describes this as a surface regression from the old TypeScript implementation into the Rust rewrite:

https://github.com/KentaroMorishita/seseragi/issues/393

What already exists is the important part.

The job is not to invent safe array access from scratch.

It is to connect:

```text
postfix expression[index]
        ↓
receiver must be Array<A>
index must be Int
        ↓
result is Maybe<A>
        ↓
same boundary behavior as std/array.get
```

Negative indexes should produce `Nothing`.

Out-of-range indexes should produce `Nothing`.

CLI, WASM, Playground, formatter, analysis tooling, and the Tour all need to agree.

So I kept calling it "the last five centimeters" in my head, but of course compiler work is never actually five centimeters.

The missing surface has to be wired vertically through the whole product.

## Two surfaces, one meaning

Seseragi sometimes has both a named API and a shorter language surface for the same operation.

For arrays:

```rust
arrays.get 1 values
```

and:

```rust
values[1]
```

should have the same safety model.

I do not want this:

```text
arrays.get -> Maybe<A>
values[i]   -> A and maybe panic
```

They look like two ways to ask the same question.

If they secretly disagree about failure semantics, the shorter syntax becomes a trap.

The current issue explicitly requires regression fixtures proving that `std/array.get` and square-bracket access produce the same results.

That principle has become increasingly important to me:

**Two surfaces are fine. Two meanings for what appears to be the same operation are not.**

## These bugs are the most irritating ones

If array indexing had never been designed, I probably would not care much.

I would just say, "not implemented yet."

But this one had everything around it:

```text
specification exists
semantics exist
Maybe result exists
runtime API exists
old implementation existed
Tour says array access exists
```

And then:

```rust
hoge[1]
```

still failed.

Come on. 😄

That is exactly the kind of bug that makes me angry for five minutes.

Then it becomes an issue.

Then the issue makes the design choice clearer.

Then somehow it becomes an article.

Apparently when you build your own programming language, even a missing bracket connection is content.