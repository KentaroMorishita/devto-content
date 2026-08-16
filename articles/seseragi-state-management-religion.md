---
title: "Why Does State Management Suddenly Need a Whole New Programming Model?"
published: true
zenn_published_at: "2026-08-07T21:46:00+09:00"
tags: webdev, programming, functional, seseragi
description: "A String that changes over time is still related to a String. I wanted state in Seseragi to feel like adding a time axis to a value, not joining a different programming religion."
series:
main_image:
canonical_url:
---

When I write Web UI, the code often begins with ordinary values.

There is a String.

There is a Record.

There is a function.

So far, everything makes sense.

Then the screen starts moving and suddenly the vocabulary changes.

Hook.

Store.

Subscription.

Dispatch.

Selector.

Provider.

**Wait. A moment ago this was just a value.**

That feeling has bothered me for a while.

## I don't hate state-management libraries

I've used React, Vue, and plenty of state-management libraries.

They're useful. They solve real problems.

The part I kept wondering about was more basic:

If I want to represent **a value that changes over time**, why does that moment sometimes require the programming model of the whole application to change too?

What if:

```text
A
```

simply became:

```text
Signal<A>
```

when time enters the picture?

## Seseragi has Signal

In Seseragi, a value that changes over time can be represented as `Signal<A>`.

A String is `String`.

A String whose current value can change over time is `Signal<String>`.

I wanted that to feel less like moving the value into another universe and more like adding one more dimension to the thing we already had.

The Tour contains a deliberately small example:

```rust
import * as signals from "std/signal"

fn double value: Int -> Int =
  value * 2

pub effect fn main = do {
  source <- signals.make 21
  let doubled = signals.map double source
  current <- signals.read doubled
  println `mapped: ${current}`
}
```

It's almost disappointingly ordinary.

I like that.

There is a value, `21`.

It becomes a value that can vary over time.

An ordinary `double` function is mapped over it.

When I need the current value, I read it.

It doesn't feel like "state management has begun." It feels like an ordinary value gained a time axis.

That continuity is what I wanted.

## I didn't want Signal to become Effect

While designing Signal, I also didn't want to throw every interesting behavior into Effect.

Making one HTTP request and representing a value that keeps changing on screen are related in the broad sense that both are more than pure arithmetic, but they are not the same responsibility.

One thing interacts with the outside world at a particular point.

Another thing has a current value that changes over time.

I want those responsibilities separated.

But I don't want separating them to force the programmer to learn two completely unrelated worldviews either.

**Separate responsibilities. Keep the worldview connected.**

I keep coming back to that sentence while building Seseragi.

## Ordinary functions should survive in UI too

On the Web UI side, an ordinary view function sits on top of the Signal.

Conceptually, the path looks like this:

```text
Model
↓
Signal<Model>
↓
map view
↓
Signal<Html<Action>>
```

The function from `Model` to `Html<Action>` is still just a function.

I don't want the existence of Signal to force that function into a component-specific spiritual dimension.

There is a separate article about the UI side of this, so I won't paste the same form sample here too.

## The Playground makes this much easier to feel

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Paste the sample above and try:

- changing `21`
- making `double` triple instead
- adding another `signals.map`
- continuing through the Tour to `set` and `combine`

Then continue into Web UI and the pieces start connecting: Model, Action, Signal, Html, DOM.

You begin with ordinary values and ordinary functions, and somehow the screen moves at the other end.

Lately, when I play with that path in the Playground, I keep having the same reaction:

**"Yeah. This is enough."**

It's not finished.

But I like the direction a lot.