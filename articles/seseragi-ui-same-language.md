---
title: "Why Should the Language Change the Moment I Build a UI?"
published: false
zenn_published_at: "2026-08-07T08:19:00+09:00"
tags: webdev, typescript, programming, seseragi
description: "I wanted UI code to remain an extension of ordinary data, functions, match, Signal, and Html instead of becoming a separate programming world."
series:
main_image:
canonical_url:
---

In ordinary application code, I create values, pass them to functions, and distinguish between cases.

Then Web UI begins, and sometimes the whole world changes.

Component.

Hooks.

JSX.

Store.

Lifecycle.

Subscription.

All of these things exist for reasons.

I've used React and Vue for years, so this isn't an argument that they should all disappear.

But at some point I started wondering:

**Why do I have to join a different programming religion the moment the thing I'm building becomes UI?**

## Couldn't a component just be a function?

In Seseragi's Web UI Tour, a small piece of UI can be an ordinary function:

```rust
fn status model: Model
  -> html.Html<Action> =
  html.p {
    id: "status",
    role: "status",
    children: model.status
  }
```

It receives `model` and returns `Html<Action>`.

That's it.

There is no special "declare a component" syntax here.

It's an ordinary function whose result happens to be Html.

I like that a lot.

## Couldn't Html just be a value?

The same idea continues upward:

```rust
fn page model: Model
  -> html.Html<Action> =
  html.main {
    class: "mx-auto max-w-xl p-4",
    children: form model
  }
```

`html.main` is not a template-language escape hatch.

The props-like part is a record. `children` is a value. The resulting `html.Html<Action>` is a value too.

That means I can move it into an ordinary function, return it from `match`, combine it with other values, and generally keep using the language I was already using.

I think what I wanted was less "a convenient UI DSL" and more **ordinary language features continuing to work all the way into UI**.

## Action is ordinary data too

The form in the Tour uses values such as:

`DraftChanged String`.

`PinnedChanged Bool`.

`Submitted`.

They aren't hidden inside a special event-system type.

They're ordinary data constructors, so ordinary `match` can handle them.

If you looked only at that part of the code, it would barely look like Web UI.

That's a feature to me.

I cover the state and Action code in other articles, so I won't paste the entire form sample again here. Repeating the same giant sample until every article looks identical would defeat the point.

## If state changes, make it Signal

Of course a UI doesn't render once and freeze forever.

Inputs change. Buttons get clicked. State moves.

That's where Signal appears.

But I didn't want Signal to become "the UI framework's store," with a completely separate worldview attached to it.

If a value changes over time, model a value that changes over time.

Conceptually:

```text
Model
↓
Signal<Model>
↓
map with an ordinary function
↓
Signal<Html<Action>>
↓
DOM
```

The responsibilities are different.

`Model` and `Signal<Model>` are not the same thing. Html and DOM are not the same thing.

But every responsibility boundary does not need to become a programming-model boundary for the user.

## I'm not trying to build React again

Once Seseragi can render interactive Web UI, comparing it with React or Elm is inevitable.

Those comparisons can be useful.

But I didn't begin with "I want to build a React alternative."

Seseragi already had data types.

It had `match`.

It had ordinary functions.

It had Effect.

Then Signal.

Then Html as a value.

I connected those things, and eventually a Web application moved on screen.

That order matters to me.

**It feels less like I placed a framework on top of the language and more like I kept using ordinary language features until the development experience started looking framework-like.**

That's one of the strangest and most interesting parts of the project right now.

## Try the form in the Playground

https://seseragi.vercel.app/tour/

https://seseragi.vercel.app/

Continue through the Web UI / feature-state part of the Tour and you can interact with a real form sample.

Good things to change:

- add another `Action`
- add another field to `Model`
- change the status after submit
- split `form` into smaller functions
- switch the rendered output with `match`

In particular, try splitting the UI into smaller functions.

There is no extra "component mechanism" to think about while doing it.

You're just splitting functions, and the UI keeps composing.

That feels much better than I expected.

## It's still experimental

Seseragi's Web UI and runtime are both still evolving, and the Playground is evolving with them.

I can't promise that the exact surface syntax will look identical six months from now.

But that is also why it's interesting to work on right now.

The question I started with was, "Why should UI make the language feel different?"

The current Seseragi answer is getting surprisingly close to something I like.

From here, I mostly need to keep using it.

And when something starts feeling ugly, change it.

That's more or less how this project works.