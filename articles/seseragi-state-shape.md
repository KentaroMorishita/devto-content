---
title: "If There Are Four States, Why Not Write Four States?"
published: false
zenn_published_at: "2026-08-03T08:17:00+09:00"
tags: typescript, programming, webdev, seseragi
description: "Boolean flags can model state, but they can also model combinations that should never exist. I started preferring types that describe the actual state space directly."
series:
main_image:
canonical_url:
---

When you build web applications, booleans tend to multiply.

```ts
type State = {
  isLoading: boolean
  hasError: boolean
  data?: string
}
```

Nothing unusual about that.

I've written plenty of code like it myself.

But sometimes I look at a type like this and imagine the values it permits:

```ts
{
  isLoading: true,
  hasError: true,
  data: "already loaded"
}
```

**What state are you even in?**

Of course, you can decide that your implementation will never create that combination.

You can protect the invariant in a reducer. You can validate it. You can test it.

But if the real states are simply:

- Idle
- Loading
- Loaded
- Failed

why not write four states in the first place?

That has gradually started to feel more natural to me.

## Decide the shape before managing the booleans

In Seseragi, I might write this:

```rust
type RequestState =
  | Idle
  | Loading
  | Loaded String
  | Failed String

fn label state: RequestState -> String =
  match state {
    Idle -> "Idle"
    Loading -> "Loading..."
    Loaded value -> `Loaded: ${value}`
    Failed message -> `Error: ${message}`
  }

pub effect fn main =
  Loaded "Seseragi"
  |> label
  |> println
```

Now `RequestState` has four possible shapes.

If data has arrived, it's `Loaded String`.

If the request failed, it's `Failed String`.

There is no state where `Loading` and `Loaded` are simultaneously true, because I never created such a state in the model.

I like the feeling of **deciding the shape of the world before working hard on its control flow**.

## Branch using the same shape

Another thing I like here is that `match` is not a special state-management feature.

It's just a normal data type being matched by a normal expression.

If I add another constructor to the type, places that handle this value have another case to think about.

The code and the thought in my head — "how many forms can this value take?" — stay fairly close together.

## TypeScript can do this too. Of course it can.

TypeScript has discriminated unions:

```ts
type RequestState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "loaded"; value: string }
  | { type: "failed"; message: string }
```

This is already much better.

So this is absolutely not a "Seseragi can do something TypeScript can't" argument.

Almost the opposite.

The more I wrote TypeScript this way, the more I started thinking:

**Wouldn't it feel good if this sat closer to the center of the language?**

In Seseragi, I wanted ADTs and pattern matching to feel less like a technique you remember to reach for and more like ordinary tools for describing data.

## I want the same model to survive all the way to the UI

The reason this matters to me isn't limited to state modeling.

UI is the same story.

Take a `RequestState`.

`match` on its shape.

Return Html.

I don't want to use an ADT to model state and then throw the model away the moment UI begins.

Define the shape of the data.

Transform it with ordinary functions.

Use `match` when cases matter.

I want that same way of thinking to continue into Signal and Html.

That continuity has become a fairly large part of what Seseragi is trying to do.

## Break it in the Playground

https://seseragi.vercel.app/

Paste the example above and first change:

```rust
Loaded "Seseragi"
```

to:

```rust
Loading
```

Then add another constructor:

```rust
  | Cancelled
```

Leave `label` unchanged and compile it.

What the compiler complains about is a pretty direct demonstration of why I prefer this model over collecting boolean flags and promising that their combinations stay sensible.

## This sounds like state management, but I think it's really data design

These days, before asking which state-management library I should use, I increasingly want to ask:

**"How many states does this thing actually have?"**

Instead of decomposing the state into booleans and then defending the valid combinations, define the possible shapes first.

I want Seseragi to make that question easy to ask very early.

Maybe I never really wanted fewer `if` statements.

Maybe I wanted to organize the world before I had to write them.