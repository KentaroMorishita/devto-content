---
title: "I Kept Calling My Formatter Ugly Until I Realized Formatting Is Grammar"
published: true
zenn_published_at: "2026-08-11T23:06:00+09:00"
tags: programming, compiler, formatting, seseragi
description: "I thought a formatter would just pretty-print an AST. Then I spent absurd amounts of time arguing about line breaks and realized formatting defines how a language is visually read."
series:
main_image:
canonical_url:
---

When I tell people I'm building a programming language, they probably imagine type systems, parsers, runtimes, and compiler internals.

Those are all there.

But one of the things I spent an unreasonable amount of time getting angry about was much simpler:

**line breaks.**

## It works, but it looks wrong

The first time a formatter starts working, it's satisfying.

You feed it messy code and it comes back aligned and structured.

Great. This is starting to look like a real language.

Then you keep looking at it.

Why did the arguments break there?

Would I really put that `match` arm on another line?

Why did this record suddenly become vertical?

Why is that separator so long?

Too much space here.

Not enough space there.

Codex changes it.

I look again.

No.

It changes again.

I look again.

**Still ugly.**

That happened a lot.

## A formatter isn't just cleanup

Before building one, I had a vague idea that formatting meant "pretty-print the AST and move on."

Not even close.

Where a line can break.

What should remain visually grouped.

Which syntax should stay on one line.

Which boundaries deserve indentation.

All of that affects how the language is read.

A formatter is effectively deciding a large part of the language's **visual grammar**.

The AST can be identical, yet two formatting strategies can make the code feel like two different languages.

This started reminding me of spacing in UI design.

The functionality can be identical, but bad spacing makes the whole interface feel cheap.

Code has the same problem.

## Yes, I actually think about 88 columns versus 80

At some point I look at what I'm doing and ask myself:

"Wasn't I building a compiler?"

And yet I'm thinking about whether a line width should be 88 or 80.

It sounds trivial until you remember that this is the text I expect to read every day.

A brilliant type system doesn't help much if every file produces the same reaction:

**ugh.**

I plan to use this language myself, so the problem is especially difficult to ignore.

Zenn articles also need to be readable on phones, which introduced another constraint: examples may need narrower layout than normal source code.

But **narrowing an article does not mean inventing fake line breaks that the language itself does not support**.

Seseragi's formatter keeps the same structural break rules even when the target line width changes.

A signature can break around `->`.

A pipeline can break at operator boundaries.

A Record can break inside its delimiters.

But ordinary function application without delimiters cannot be split at a position where the parser would interpret the next line as another expression.

So something like this is a meaningful break:

```rust
let total =
  values
  |> filter keep
  |> map convert
  |> reduce 0 (+)
```

The principle is simple: **only break where the meaning survives**.

I don't want horizontal scrolling in an article.

But I want an article sample that looks nice and no longer compiles about a hundred times less.

## I'm not trying to discover the one true formatter

I don't think there is an objective perfect formatting style.

Some people like Prettier.

Some people like the authority of `gofmt`.

Some people want every knob exposed as configuration.

For Seseragi, I lean toward making "format it normally and it feels normal" work without a hundred options.

I would rather the language have a coherent visual shape than outsource every choice to configuration.

Unfortunately, defining "normal" is much harder than it sounds.

## I have also yelled at ChatGPT about this

Formatter discussions are not the only place this happens.

When I use ChatGPT to iterate on Playground examples or UI, I frequently reach a point where my feedback becomes:

"No, that's not it."

Sometimes shorter:

"Ugly."

And, on especially bad days, a much less publishable one-word review.

I'm not trying to turn insulting an AI into a development methodology.

The useful part is what happens next.

Before I can explain the problem, I often feel the discomfort first.

Then I ask:

"Why does this look wrong?"

And the answer turns out to be grouping, responsibility, whitespace, or a semantic boundary.

The workflow is surprisingly similar whether I'm looking at a formatter, language syntax, or a UI.

## Sometimes visual ugliness points back to semantics

The funniest part is that formatting problems occasionally reveal problems in the language itself.

Every possible layout looks awkward.

The line always breaks in a strange place.

You need extra parentheses just to make the structure readable.

At that point, the formatter may not be the real problem.

Sometimes the syntax itself is fighting the shape I want people to see.

Then the investigation goes something like:

```text
looks ugly
↓
blame the formatter
↓
still looks ugly
↓
blame the syntax
↓
blame the responsibility boundary
```

How did a line break get us here?

## You can format code in the Playground

https://seseragi.vercel.app/

The Playground uses the formatter too, so you can deliberately mess up some code and format it again.

Watching messy code become structured is satisfying.

But I recommend also asking:

**"Would I want it to format this way?"**

If something looks strange, maybe it's a bug.

Maybe it's a deliberate rule.

Or maybe I'll look at the same line three days later and complain about it too.

Seseragi is still pre-release.

That uncertainty is part of what makes the formatter interesting right now.