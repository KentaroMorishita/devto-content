---
title: "Is Seseragi a Functional Programming Language? I'm Not Sure."
published: true
zenn_published_at: "2026-08-05T08:16:00+09:00"
tags: functional, programming, monad, seseragi
description: "Seseragi has Maybe, Either, Functor, Applicative, Monad, ADTs, and match. Yet I still don't think of it as a language designed from an FP label first."
series:
main_image:
canonical_url:
---

Seseragi has Maybe.

It has Either.

It has Functor, Applicative, and Monad.

It has `<$>`, `<*>`, and `>>=`.

It has `match` and ADTs.

Once I list all of that, there is a very predictable response:

**"So it's a functional programming language."**

Fair.

Even I would probably make that assumption.

And yet I don't really think of Seseragi that way while I'm designing it.

## I am not going to pretend I don't like Monad

That would be impossible to defend.

I do.

There was a period when I spent about three months of train rides talking through Monad with GPT.

Then I built F-Box.

The old implementation is still here:

https://github.com/KentaroMorishita/f-box-core

https://github.com/KentaroMorishita/f-box-react

So "I'm not really interested in this stuff" would obviously be a lie.

But I did not add Monad to Seseragi because I wanted the language to look more functionally programmed.

I wanted to connect values.

I wanted failures to stay values.

I wanted interactions with the outside world to compose.

I kept following those problems, and eventually found abstractions that already had names.

At that point, using the existing abstraction seemed better than inventing a private version of the same idea.

That's closer to how it happened.

## I didn't start with a paradigm

I never wrote "Seseragi is a language in paradigm X" at the top of a document and derived the features from there.

The process tends to run in the opposite direction.

I write ordinary software and think:

"This is annoying."

"Wouldn't it be nicer if this were shaped differently?"

Then I keep digging.

If there are several possible states, I want an ADT.

If a value may be absent, I want Maybe.

If something can fail, I want Either or typed failure to make that visible.

If a value changes over time, I want Signal.

If code crosses into the outside world, I want Effect to show the boundary.

If I'm writing UI, I still want ordinary data and functions to work.

Those responsibilities are different.

What I dislike is being forced into an unrelated mental model every time the responsibility changes.

That feels much closer to the actual motivation behind Seseragi than any paradigm label.

## I do care about being declarative

There is one direction I can state more confidently.

When I read code, I like **what something is** to appear before instructions about how to manipulate it.

I prefer seeing the shape of data, transformations of values, and explicit cases over tracing a long sequence of commands.

That preference naturally overlaps with a lot of tools associated with functional programming.

But I don't want the conclusion to become, "You must know FP etiquette before you're allowed to use the language."

Ideally, the theory can arrive later.

You use something because it reads naturally, and at some point somebody says:

"By the way, that's a Functor."

Fine by me.

## You don't need to know `<$>` to use it

For example, the Tour includes code like this:

```rust
fn double value: Int -> Int = value * 2
let named: Maybe<Int> = map double (Just 21)
let operator: Maybe<Int> = double <$> Just 21
let missing: Maybe<Int> = double <$> Nothing
```

If `<$>` means nothing to you, use `map`.

If you already like the operator, use the operator.

I don't want Seseragi to become a language where memorizing symbols is an entrance exam.

I also don't want to take the symbols away from people who like them.

That would inconvenience me personally.

## So what is Seseragi, then?

The description that currently feels closest is something like:

**a language where I want useful abstractions to remain ordinary language features that can compose all the way through the program.**

That is not a very useful category label.

Marketing departments would probably ask for another draft.

But the language is still evolving, and I don't see much value in narrowing its identity just to make the label cleaner.

If Seseragi ever becomes mature enough that somebody else wants to classify it, they can do that.

I'll probably still be arguing about where a line break should go.