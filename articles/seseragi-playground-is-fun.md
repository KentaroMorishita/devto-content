---
title: "My Language Playground Somehow Turned Into a Place to Build Web Apps"
published: true
zenn_published_at: "2026-08-08T11:17:00+09:00"
tags: programming, webdev, playground, seseragi
description: "Seseragi's Playground started as a place to run compiler samples. Then Signal, DOM, forms, Tour, and Discover showed up, and now I sometimes forget what I'm building."
series:
main_image:
canonical_url:
---

When I hear "Playground for a homemade programming language," I imagine something simple.

Write code on the left.

Press Run.

See the result on the right or underneath.

Early Seseragi felt more or less like that.

The browser could compile code written in the language I was building.

That alone made me happy.

Recently, though, things have become a little strange.

**The Playground has become a place where I can casually build Web applications in my own language.**

Sometimes I genuinely lose track of what I'm making.

## At first, "it runs!" was enough

Hello World runs.

FizzBuzz runs.

`match` runs.

Maybe runs.

Those were straightforward homemade-language victories.

Paste some code into the Playground, press Run, see output.

Of course my own language should eventually be able to run its own code, but it still feels a little magical every time another piece starts working.

## Then HTML Preview started working

Seseragi can construct Html as a value.

At first, merely producing server-rendered-looking Html was interesting enough.

Then the DOM runtime connected.

Events started firing.

Signals started changing.

The screen started updating.

At that point the Playground stopped feeling like a compiler test page.

It became a place where I could think, "I wonder what this UI would look like," and just write it.

## Now a button can just update the screen

A cleaned-up version of the DOM sample in the Tour looks roughly like this:

```rust
import * as dom from "std/web/dom"
import * as html from "std/web/html"
import * as signals from "std/signal"
import { MutableSignal } from "std/signal"

type Action =
  | Increment

fn view count: Int -> html.Html<Action> =
  html.button {
    id: "increment",
    onClick: Increment,
    children: `Count: ${count}`
  }

fn handle state: MutableSignal<Int>
  -> action: Action
  -> Task<Unit> =
  match action {
    Increment ->
      signals.update (\value: Int -> value + 1) state
  }

fn domError error: dom.DomError -> String =
  show error

fn runtimeError error: dom.DomRuntimeError<Never>
  -> String =
  show error

pub effect fn main
  -> Unit
  with dom: dom.Dom
  fails String =
  do {
    state <- signals.make 0
    let content = signals.map view state
    let options = dom.defaultOptions ()

    target <- dom.query "#app" |> mapError domError

    dom.run options target (handle state) content
      |> mapError runtimeError
  }
```

Paste this into the Playground with HTML Preview enabled and the count increases every time you click the button.

Looking at this code, the Playground feels very far away from "a place where I inspect compiler output."

## Forms were where it became genuinely fun

Further into the Tour, input, checkbox, submit, and other ordinary form interactions started working too.

There is a Model describing state.

There is an Action describing events.

An ordinary `match` updates the Model.

Signal carries change over time.

Html reacts to it.

Somewhere around here, my own use of the Playground changed.

It stopped being a place where I verify the compiler and became **a place where I play with Seseragi**.

## I like having both Tour and Discover

The Playground has a Tour for walking through features in order and Discover for jumping directly to samples by purpose.

The Tour starts at Hello World and gradually moves forward.

Discover is where I go when I think, "Show me Maybe," "I want the Web UI sample," or "Where was that form example again?"

This is useful even while building the language.

Sometimes I forget exactly how one of my own features is currently written, open my own Playground, and let my own Tour remind me.

I built a language and then built a tutorial to teach its author how to use it.

This is all going very well.

## A Playground exposes ugliness immediately

A specification document can hide awkward syntax surprisingly well.

Actually typing the language does not.

"Are there too many parentheses here?"

"Why does this line break look terrible?"

"What is this error message even trying to tell me?"

"Why is the spacing in this UI so weird?"

The moment the language becomes something I can touch, those problems surface immediately.

That's been extremely useful.

I probably spend more time complaining about the Seseragi code I see in the Playground than reading every line of Rust inside the compiler.

But the surface is what people eventually use, so I think that priority is defensible.

## Please break it

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

For the counter above, try:

- change `+ 1` to `+ 10`
- add a `Decrement` Action
- change the button text
- split `view` into smaller functions
- add another Action and argue with the compiler

Then open random Discover samples and break Maybe, forms, or Web UI.

I don't think you have to approach it as a carefully structured tutorial.

**Breaking things and arguing with the compiler** is a perfectly good way to learn it.

## As the Playground grows, the language grows with it

I'm still changing the Playground itself quite a lot.

Search. Explorer. Preview. Mobile behavior. Tour. Discover.

Those can look like concerns separate from a language implementation, but in practice they feed directly back into it.

Is the language awkward, or is the Playground awkward?

Is the error bad, or is the presentation of the error bad?

Is the sample wrong, or is the syntax wrong?

Once there is a place where the language can be used every day, I keep stepping on these questions.

Then a Playground problem sends me back into the compiler.

I fix the compiler and return to the Playground.

That's more or less the current loop.

We've come a long way from "I pressed Run and Hello World appeared."

It's still unfinished, though.

Which may make this the best time to play with it.

If you find something weird, there's a decent chance I'll look at the same thing later and say, "Yeah, that's ugly."