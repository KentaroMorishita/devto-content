---
title: "TypeScript Can Express Almost Anything. That's Part of the Problem."
published: true
zenn_published_at: "2026-08-02T11:08:00+09:00"
tags: typescript, programming, webdev, seseragi
description: "I like TypeScript a lot. But after years of using it, I started wondering whether being able to express almost anything also means carrying too many possible shapes at once."
series:
main_image:
canonical_url:
---

I like TypeScript a lot.

I've used it for a long time, and I still think it's incredibly useful.

So this is not an article about beating up TypeScript.

But after using it for years, I sometimes catch myself thinking:

**It can express almost anything. Maybe it can express a little too much.**

There is `null`.

There is `undefined`.

You can throw exceptions.

You have Promises.

You can make things mutable.

You can model state with as many booleans as you want.

Once React enters the picture, you can add JSX, hooks, stores, and whatever else the application needs.

All of those things exist for good reasons.

But "I can write this" and "this is how I want to write it" are not quite the same thing.

## Take state, for example

This is perfectly normal TypeScript:

```ts
type State = {
  isLoading: boolean
  isLoggedIn: boolean
  hasError: boolean
  user?: User
}
```

It compiles.

It works.

But the type also admits something like this:

```text
isLoading = true
isLoggedIn = true
hasError = true
user = undefined
```

What state are you even in?

Of course, the implementation can promise never to create that combination.

A reducer can enforce the invariant. Validation can enforce it. Tests can help enforce it.

But if the states I actually mean are only:

- Loading
- Guest
- LoggedIn User
- Failed Error

then I increasingly want to write exactly those four states from the beginning.

In Seseragi, I can start with the shape itself:

```rust
type Session =
  | Loading
  | Guest
  | LoggedIn User
  | Failed Error
```

Before working hard on control flow, reduce the number of states that can exist at all.

I find that much easier to reason about.

There is a whole separate article in this series about the shape of state, so I won't turn this one into the ADT article too.

## Take "there might not be a value"

TypeScript has `undefined` and `null`.

Again, useful.

But they enter the world of ordinary values so naturally that it's easy to arrive somewhere later and realize, "Oh right, this was one of those values that might not exist."

Seseragi has `Maybe<A>`.

```rust
let name: Maybe<String> = Nothing
```

That one line tells me, at minimum, that `name` is not an ordinary `String`.

What I like is that **"there might be no value" is visible directly in the shape of the type**.

How to `match` it or `map` it is a separate question. I have another article for that.

If I paste the same Maybe example into three different articles, the articles themselves start becoming the ugly part.

## Take the outside world

Sometimes I just want to make an HTTP request, but the implementation layer makes me think about Promises and `async`/`await`.

In a browser there is `fetch`. On Node there are other runtime details.

Those details matter somewhere.

But I started wondering whether the person writing Seseragi code should have to carry all of them every time they merely want to say, "this interacts with the outside world."

That line of thought eventually leads into Seseragi's `Effect`.

## Maybe what I wanted wasn't restriction, but shape

While building Seseragi, I sometimes ask myself whether I'm trying to create a more restrictive language.

I don't think that's quite it.

I'm less interested in banning things than in being able to write **the thing I'm thinking about in roughly the same shape that I'm thinking about it**.

If there are four states, write four states.

If a value may be absent, use Maybe.

If something can fail, let the type show failure.

If it touches the outside world, make that visible as Effect.

If it changes over time, make it Signal.

If it's UI, make it Html.

I want responsibilities to be separated clearly.

What I don't want is to jump into a completely different programming worldview every time the responsibility changes.

That may be one of the parts of Seseragi I find most interesting right now.

## Play with it

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

A good path is to start with the ADT and `match` sections of the Tour.

Then open the Maybe examples and switch between `Just` and `Nothing`.

After that, continue into Web UI.

By then, I think you can start to see what Seseragi is trying not to hide, and what it prefers to make visible as a shape in the language.