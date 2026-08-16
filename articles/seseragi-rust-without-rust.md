---
title: "I Can Barely Read Rust, but I'm Building a Compiler in Rust"
published: true
zenn_published_at: "2026-08-10T21:36:00+09:00"
tags: rust, ai, programming, seseragi
description: "Codex writes a large part of Seseragi's Rust compiler. That hasn't made architecture less important — it has made bad architecture faster to complete."
series:
main_image:
canonical_url:
---

The Seseragi compiler is currently written in Rust.

I can barely read Rust.

Written as two sentences, this project sounds deeply questionable.

## I don't think this would have worked before

If you're building your own compiler, the obvious assumption is that you should understand the implementation language very well.

That is still an advantage. A huge one.

But in the Seseragi rewrite, Codex writes a large part of the Rust implementation.

My job is not to personally type every line.

I spend much more time on questions like:

- what should this mean in Seseragi?
- which layer owns that responsibility?
- does this syntax feel good?
- are backend concerns leaking into the public surface?
- will this implementation choice trap us later?

And if the result feels wrong, I make it go back.

## "AI can write it, so architecture matters less" turned out to be completely wrong

At first, part of me wondered whether AI implementation meant I could be more relaxed about internal structure.

Local implementation is astonishingly fast now.

That speed is exactly what makes careless architecture dangerous.

If you put a responsibility in the wrong place, **the wrong architecture can become fully implemented at incredible speed**.

Sometimes it even comes with tests.

It looks polished.

It is still wrong.

That is terrifying in a very modern way.

## So I spend more time writing Issues

Before handing work to Codex, I now think much harder about the shape of the task.

What is actually in scope?

What is the source of truth?

What should explicitly wait for a future Issue?

Does this change break an assumption needed by the next piece of work?

AI made code production faster, so the human side of the loop moved further toward designing the entrance to the work.

It's strange, but I think I spend more time thinking about architecture now than I did when I personally wrote more of the implementation.

## This is not an argument that I never need to learn Rust

I want to be clear about this.

Understanding Rust would obviously make me stronger at this project.

It helps when debugging low-level behavior, looking at performance, reviewing ownership choices, or encountering `unsafe`.

When I need to understand something, I read it.

The interesting part to me is not "you don't need to know your tools anymore."

It's that **I can move a language implementation forward by holding onto the semantics and architecture even when I don't completely control the implementation language**.

Once AI enters the implementation loop this deeply, the question "what does the author actually do?" starts to change.

## I care more about the surface syntax than thousands of lines of Rust

Codex can produce a large Rust diff and I can review it fairly calmly.

Then I look at a Seseragi sample and see:

```text
one character that feels unnecessary
```

or:

```text
an ugly line break
```

and suddenly I become extremely opinionated.

I think the reason is simple.

I'm not primarily trying to create **a Rust compiler**.

I'm trying to create **Seseragi as an interface that humans use**.

The compiler is the machinery that protects that meaning.

So I'm harsher on the surface than on implementation details I can delegate.

This seems logically consistent to me.

Codex may have a different opinion.

## Somehow, it actually runs

https://github.com/KentaroMorishita/seseragi

The project now has a Rust compiler, CLI, LSP, formatter, and WASM Playground sharing the same compiler-driver direction.

https://seseragi.vercel.app/

I don't feel that the language stops being mine because I didn't personally write every line of Rust.

I keep ownership of questions like:

What does the language mean?

What is allowed?

What feels wrong enough to change?

An AI-assisted homemade programming language is a very strange kind of software project.

I think we're only beginning to find out how strange.