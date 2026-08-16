---
title: "I'm Building a Programming Language, and Somehow I Keep Obsessing Over Spacing"
published: true
zenn_published_at: "2026-08-13T18:23:00+09:00"
tags: programming, webdev, ui, seseragi
description: "Seseragi has a parser, type inference, Effect, Signal, and a runtime. Yet one of the phrases I say most often while building it is: the spacing looks wrong."
series:
main_image:
canonical_url:
---

Seseragi is a programming language, so naturally there is a compiler.

There is a parser.

Type inference.

Effect.

Signal.

A runtime.

And yet one of the things I say most often while building it is:

**"The spacing looks wrong."**

## Once the Playground worked, "working" stopped being enough

At first, being able to compile and run Seseragi in a browser was exciting by itself.

That is already a ridiculous thing to see when the language is your own.

But humans adapt quickly.

Once it worked, I started looking at everything around the Run button.

The search panel feels cluttered.

The gap between Editor and Preview feels wrong.

These cards are too close together.

Those elements are too far apart.

The text feels cramped.

On mobile it feels even worse.

And eventually I say:

"Why is there no space here?"

## This isn't only a UI problem

The funny part is that I do almost exactly the same thing to the language itself.

Too many parentheses.

Too many commas.

Awkward line breaks.

Function application that's harder to scan than it should be.

`match` arms breaking in visually strange places.

Apparently I spend a lot of time worrying about **visual noise**.

If two forms mean the same thing, I usually prefer the one that asks my eyes to process less accidental structure.

But removing too much structure can make meaning disappear.

So I'm constantly looking for the line between "quiet" and "ambiguous."

## Even Tailwind classes become language noise in a demo

When I was writing Web UI samples in the Playground, dumping long Tailwind class strings into every element quickly made the examples unreadable.

So I started moving classes into arrays, combining them with `cx`, and splitting UI into smaller functions.

That has nothing to do with the compiler's semantics.

But if a demo is visually noisy, a reader doesn't think:

"This Tailwind sample could use refactoring."

They think:

"Seseragi code looks noisy."

I don't want the demo to become an accidental argument against the language.

Presentation is part of the first impression of the syntax.

## The Playground keeps turning into an IDE

Originally, it was one file and a Run button.

Then search appeared.

Then I wanted an Explorer.

Then module splitting.

Then full-screen Preview.

Then a Tour.

It keeps becoming more IDE-like.

Even I sometimes ask:

**"How far am I planning to take this?"**

But a good Playground lowers the cost of touching a new language dramatically.

No installation.

No reading an entire README first.

Open it, paste code, press Run.

That matters a lot when an article tries to move someone from "this idea is interesting" to "let me change one value and see what happens."

## Language UX is bigger than syntax

I used to think "language design" mostly meant syntax and semantics.

Those are obviously the core.

But once a human actually uses the language, the experience includes questions like:

- can I understand the errors?
- does the formatter produce code I want to read?
- can the editor show useful type information?
- can I try something immediately in the Playground?
- does the interface survive on mobile?

All of that becomes part of what the language feels like.

Which is why I can spend ten minutes thinking about a compiler issue, switch tabs, and immediately become angry about padding in the search panel.

It's a busy project.

## If something feels awkward, tell me

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Feedback doesn't need to be about deep type-system theory.

If you use the Playground and think:

"This is hard to use."

"That display looks strange."

"Why is the spacing like this?"

I consider that useful language feedback too.

There is a non-zero chance it will bother me more than a sophisticated compiler-theory observation.

And there is an even better chance that an Issue will exist by the next day.