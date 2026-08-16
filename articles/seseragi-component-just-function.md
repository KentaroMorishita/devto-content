---
title: "Couldn't a Component Just Be a Function?"
published: false
zenn_published_at: "2026-08-06T21:39:00+09:00"
tags: webdev, programming, frontend, seseragi
description: "If something receives values and returns HTML-like values, I kept wondering why it needed to become a special kind of thing at all."
series:
main_image:
canonical_url:
---

When you build Web UI, at some point a special thing called a "component" tends to appear.

React has them. Vue has them. Plenty of other systems do too.

I've used components for years, and I don't dislike the idea.

But at some point I had a very simple thought:

**If something receives values and returns an HTML-like value, couldn't it just be a normal function?**

## The moment it becomes special, the surrounding vocabulary grows

Once something is a component, a lot of concepts tend to appear around it.

Props.

State.

Hooks.

Lifecycle.

Re-rendering.

Memoization.

Again, all of these exist for real reasons.

But if the thing I want to write is only "take a title and return a heading," I don't necessarily want to carry the entire worldview every time.

## In Seseragi, it really is just a function

The smallest component example in the Tour looks like this:

```rust
import * as html from "std/web/html"

type Action =
  | NoAction

fn heading -> html.Html<Action> =
  html.h2 {
    children: "Component"
  }

pub effect fn main =
  heading ()
  |> html.renderToString
  |> println
```

There is nothing special attached to `heading`.

It's just a function.

Its return type happens to be `html.Html<Action>`.

And `html.h2` doesn't feel like an escape into a separate template language either. It looks like a function constructing an ordinary value.

I like this much more than I expected to.

## I don't want HTML to make me switch languages

Seseragi's Web UI didn't begin as an attempt to replace React.

It was almost the opposite experiment:

**How far can the language's ordinary features go before I actually need a new concept?**

Seseragi already had ADTs.

It had `match`.

It had ordinary functions.

It had Records and Structs.

It had Signal.

It had Effect.

So if Html could also be a value, maybe UI could remain an extension of the same language.

```text
Data
  ↓
function / match
  ↓
Html<Action>
```

And if the data changes over time:

```text
Signal<Data>
  ↓
function / match
  ↓
Signal<Html<Action>>
```

No sudden teleportation into the spiritual plane of a component framework.

## The fact that it "isn't a framework" is the funny part

Once the Playground could actually run DOM interactions, the result started looking a lot like a framework from the outside.

It can hold state.

It can handle events.

Forms work.

There is an HTML Preview.

But in my head, I didn't really build a framework and then attach it to Seseragi.

I connected ordinary language features far enough that the result started looking framework-like.

That may be one of the most interesting things that has happened in the project.

## Try it in the Playground

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Paste the `heading` sample and try:

- make it receive a String
- change `html.h2` to `html.p`
- build two headings and put both into children
- add an Action and a button

The part I want you to notice is what you *don't* have to do.

You don't have to stop and think, "Now I am defining a component."

You're writing a function.

It just happens to appear on a screen.

I think that's enough.