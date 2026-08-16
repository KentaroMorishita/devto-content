---
title: "I Tried to Eliminate if. I Ended Up Putting match in My Language."
published: false
zenn_published_at: "2026-08-01T11:24:00+09:00"
tags: typescript, programming, functional, seseragi
description: "I once wrote about eliminating if statements in TypeScript. I wasn't really fighting if — I was trying to make branching feel like producing a value."
series:
main_image:
canonical_url:
---

In 2024, I wrote a Qiita article whose title roughly translates to "The Plan to Eradicate `if` Statements."

https://qiita.com/KentaroMorishita/items/6329d20fbc6f98f72864

Looking at the title now, it sounds a little dangerous.

But I didn't literally want to remove `if` from the world.

What bothered me was **having to chase control flow when all I really wanted to do was distinguish between cases**.

## I was fighting this in TypeScript

TypeScript can obviously express the usual version:

```ts
let label: string

if (score >= 90) {
  label = "A"
} else if (score >= 70) {
  label = "B"
} else {
  label = "C"
}
```

There is nothing wrong with this.

But the thing I care about isn't really "a procedure that keeps assigning into `label`."

It's this:

**classifying `score` produces a `label`.**

That is why I went through a period of preferring ternary expressions:

```ts
const label = score >= 90
  ? "A"
  : score >= 70
    ? "B"
    : "C"
```

Now it's an expression.

Great.

Until the cases grow and it becomes unpleasant to read in an entirely different way.

So I started building my own `match`- and `when`-like abstractions on top of TypeScript.

In hindsight, the moment I started imitating language features with a library was probably a warning sign.

## In Seseragi, it simply became match

Seseragi lets me write the classification directly:

```rust
fn grade score: Int -> String = match score {
  value when value >= 90 -> "A"
  value when value >= 70 -> "B"
  _ -> "C"
}
```

What I like here isn't merely that `match` is convenient.

It's that **it exists as an expression from the beginning**.

There is no temporary variable required just to hold the result.

The whole function reads as "classify a score into a String."

## ADTs are where match becomes much more interesting

For numeric conditions alone, TypeScript is already perfectly capable.

Where Seseragi's `match` becomes much more satisfying to me is when the value itself is an algebraic data type.

```rust
type Session =
  | Loading
  | Guest
  | LoggedIn String
  | Failed String

fn label session: Session -> String = match session {
  Loading -> "Loading..."
  Guest -> "Guest"
  LoggedIn name -> `Hello, ${name}`
  Failed message -> `Error: ${message}`
}

pub effect fn main =
  LoggedIn "Kentaro"
  |> label
  |> println
```

The type defines the possible states, and `match` handles those exact shapes.

For me, that is much easier to read than looking at several booleans and reconstructing which state the application is supposed to be in.

And if I add a constructor and forget to handle it, the compiler can turn that into an exhaustiveness problem.

That is much closer to what I was actually reaching for when I was building match-like libraries in TypeScript.

## Apparently I've been doing the same thing the whole time

Years ago, I was trying to make branching behave more like producing a value on top of TypeScript.

Now I have a language with `match` in it.

It doesn't feel like my philosophy suddenly changed.

I just kept digging until:

**something I had been forcing a library to imitate became an ordinary language feature.**

That escalated a bit.

## Break it in the Playground

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Paste the `Session` example and add another constructor:

```rust
  | Suspended String
```

Then compile without changing `label`.

That is a good way to see how far the old "eradicate `if`" idea eventually traveled.

For the record, Seseragi still has `if`.

The eradication failed.

I think that's probably for the best.