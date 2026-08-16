---
title: "The Best Feeling Is When Ordinary Features Compose Into Something Bigger"
published: false
zenn_published_at: "2026-08-06T08:14:00+09:00"
tags: programming, webdev, design, seseragi
description: "Adding a new feature is satisfying. Realizing I don't need a new feature because existing data, functions, Signal, Effect, and Html already compose is even better."
series:
main_image:
canonical_url:
---

There is a moment I enjoy more than adding a new feature to Seseragi.

It's when I realize:

**I don't need a new special feature at all. The things already in the language compose into the thing I wanted.**

That feels much better.

## Adding a dedicated feature always looks easy at first

A new use case appears.

Add syntax.

Add a keyword.

Add a special runtime rule.

In the short term, this can be the fastest solution.

But every special feature also creates another thing to learn.

And if it gets its own semantics, six months later someone — probably me — looks at it and asks:

"Why is this one thing special?"

Whenever old versions of Seseragi started smelling like that, it bothered me a lot.

## Web UI made this especially obvious

When I started exploring Web UI, I didn't begin by designing component syntax.

The language already had ordinary functions.

Records.

ADTs.

`match`.

Arrays.

So I wondered whether Html could simply be another value built from those same tools.

The component model in the Tour can be summarized like this:

```text
Data
  ↓
function / match
  ↓
Html<Action>
```

No special component declaration is required for that path to go surprisingly far.

There is a separate article where I show the actual component code. Repeating the exact same sample here would make the article less focused, not more complete.

## I didn't want state to become another universe either

Once UI can render, the next request is obvious: make it change.

Instead of immediately adding a whole "state-management framework," Seseragi has `Signal<A>` for values that change over time.

That turns:

```text
A
↓
function
↓
Html
```

into:

```text
Signal<A>
↓
map function
↓
Signal<Html>
```

There is a new responsibility.

But there isn't necessarily a completely new way of thinking.

That is much closer to the kind of language I want.

## Effect follows the same principle

Interaction with the outside world is not the same thing as ordinary value transformation.

So it deserves a separate responsibility.

But separating it doesn't mean I want to invent a giant Effect-only worldview either.

It should still compose as a value where that makes sense and connect back to ordinary functions at clear boundaries.

Maybe and Either are different again.

Their meanings are not interchangeable.

But where they share ordinary operations — `map`, `match`, function application — I would rather reuse those language ideas than invent a separate miniature language for every type.

## Separate responsibilities, not worldviews

This is probably the sentence that best captures what I've been doing lately:

**Separate the responsibilities, but don't make each responsibility its own programming worldview.**

Effect and Signal are not the same thing.

Html and DOM are not the same thing.

Maybe and Either are not the same thing.

I do not want to blur all of them into one abstraction just for the sake of uniformity.

But I also don't want every boundary to say:

"From here on, use another framework."

"From here on, learn another DSL."

"From here on, composition follows unrelated rules."

I want the responsibilities to stay distinct while ordinary types, values, and functions connect them.

Looking back, I think I've been trying to do that throughout Seseragi.

## Fewer special features is not a moral achievement

I will add syntax when the language actually needs syntax.

Seseragi has `match`.

It has `do`.

It has `effect fn`.

This is not a competition to minimize the keyword count.

The question I want to ask before adding a concept is simply:

Does this introduce genuinely new meaning, or can the meaning already be expressed by composing things we have?

If the second answer works, I'm happy.

That's all.

## Look for the boring parts in the Playground

https://seseragi.vercel.app/

Open one of the Web UI samples and you may notice an unexpectedly large number of ordinary functions.

A demo for a homemade programming language could probably look more impressive if every screen contained exotic syntax.

But the reaction I would most like is:

**"Huh. I can just read this."**

I didn't make a language because I wanted ordinary programming to look strange.

I made it because I wanted ordinary programming to feel better.