---
title: "The More Code AI Wrote, the More Architecture Became My Job"
published: false
tags: ai, programming, architecture, seseragi
description: "I expected AI implementation to reduce the amount of engineering I had to do. Instead, it pushed my work upward into meaning, boundaries, and sources of truth."
series:
main_image:
canonical_url:
---

A lot of Seseragi is being implemented by AI now.

I am not personally writing every line of Rust.

In fact, one of the stranger parts of this project is that the Rust compiler kept growing while I could barely read Rust comfortably at the beginning.

I wrote about that earlier:

https://dev.to/kentaromorishita/i-can-barely-read-rust-but-im-building-a-compiler-in-rust-1d59

At first I thought the obvious consequence would be:

> If AI can implement more of the code, the human has less engineering work to do.

What happened felt almost like the opposite.

**The more implementation I handed to AI, the more important it became for me to decide the architecture before the implementation started.**

## AI is already very good at finishing an Issue

Modern coding agents can do a surprising amount of ordinary repository work.

Give one a reasonably detailed Issue and it can:

- inspect the codebase
- change the implementation
- add tests
- update documentation
- fix formatting/lints
- iterate on failures

That is not hypothetical in Seseragi. A large amount of the compiler has been developed this way.

If the only question were:

```text
Can AI write compiler code?
```

the answer would already be yes.

The more interesting question became:

```text
What happens when it implements the wrong idea extremely well?
```

## A polished mistake is scarier than ugly code

Bad code is often easy to reject.

A giant function.

Strange names.

Obvious duplication.

No tests.

You look at it and think: nope.

The more dangerous output is:

```text
wrong responsibility boundary
↓
clean modules
↓
good tests
↓
careful error handling
↓
docs updated too
```

Everything looks professional.

The architecture is still wrong.

That is harder to notice and psychologically harder to throw away.

AI did not remove the need for design review.

It made **design mistakes cheaper to implement to completion**.

## "What should this do?" stopped being enough

Take an HTTP client.

The shortest implementation for a TypeScript backend could simply emit host `fetch` calls.

That would work.

But Seseragi wants a boundary closer to:

```text
std/http
↓
HttpClient capability
↓
Provider contract
↓
host adapter
```

The host may use `fetch` underneath.

The language should not accidentally make browser `Request`, `Response`, `Promise`, or `AbortController` part of its public semantics.

If the Issue only says:

> Implement HTTP client support.

then a direct-fetch implementation is a perfectly reasonable local answer.

The code can be correct.

The architecture can still be wrong for Seseragi.

So the Issue now needs to say more:

```text
which layer owns this meaning?
which existing contract is the source of truth?
which host details must not cross the boundary?
what new parallel subsystem must not be created?
```

## The old TypeScript implementation already taught me what blurred boundaries cost

Seseragi was originally implemented in TypeScript.

That version moved quickly.

Surface syntax and emitted TypeScript were close together.

Web runtime experiments were easy.

AI could modify it quickly too.

Then the language grew.

Questions became harder to answer:

```text
Where is this semantic decision made?
Where did this type information disappear?
Which special-case table is canonical?
Why is a backend concern visible this high up?
```

The individual code was not necessarily terrible.

The responsibility map was deteriorating.

The Rust rewrite was important less because Rust is magically architectural and more because it was a chance to cut the compiler into explicit stages again:

```text
Surface
Resolved
Typed HIR
Core IR
backend IR
runtime Provider
```

That separation changed the way AI could be given work.

## Architecture became a task boundary

If an Issue is parser-only, I can say so.

If the source meaning is already correct and only TypeScript lowering is wrong, the backend should be fixed without changing Core semantics.

If a problem belongs to the runtime provider, source-language types should not be redesigned to make the adapter easier.

Some compiler features still have to travel vertically through every layer.

That is fine.

The important part is that the Issue can state what each layer is responsible for and what must remain unchanged.

**The architecture becomes a map for dividing work between agents.**

That turned out to be much more useful than merely having "clean code."

## AI is extremely willing to create a second source of truth

This is one of the patterns I now watch aggressively.

Suppose the repository already has a canonical registry, but it is not obvious enough.

An AI agent needs a lookup table for one feature.

The helpful local move is:

```text
create another table near this feature
```

The Issue passes.

Tests pass.

Six months later, the two registries disagree.

So current Issues often say explicitly:

```text
reuse the existing registry
this module is the source of truth
do not add a second table
```

That may sound over-prescriptive.

It is really architecture documentation written at the point where the implementation is about to create another truth.

## Non-goals became much more important

AI agents are helpful.

If I ask for HTTP, they may notice that JSON helpers would be convenient.

Retry would be useful too.

Redirect handling could be nicer.

A scaffold could include a router and CSS framework.

All reasonable ideas.

Maybe all wrong for this Issue.

So I write the boundary explicitly:

```text
not in this layer
separate Issue
not part of the current public contract
```

This is not about making the agent dumb or obedient.

It is about deciding which design freedom is intentional.

**If the architecture says a concern lives somewhere else, the Issue should say so before the agent helpfully solves it here.**

## I write more Issues now, not fewer

My direct coding time went down.

My Issue-writing time went up.

A serious work item now often contains:

```text
goal
dependencies
existing source of truth
scope
invariants
acceptance criteria
non-goals
```

I originally thought of that as prompt material for the AI.

It turned into design work for myself.

While writing the Issue, I repeatedly discover questions such as:

> Wait. Which layer actually owns this?

That is useful.

The design gets reviewed before hundreds of lines of implementation exist.

## Code review moved upward too

I still care about naming, duplication, readability, and performance.

But the first review questions changed.

I now look for things like:

```text
Is this responsibility in the correct layer?
Did we create a second source of truth?
Did host behavior leak into language semantics?
Did the public surface change accidentally?
Did a new parallel execution path appear?
```

AI is increasingly competent at implementation detail.

That pushes the most valuable human review toward the architectural contract around the implementation.

## I keep the entrance and exit, and give away a lot of the middle

The current workflow is roughly:

```text
decide meaning
↓
turn it into a constrained Issue
↓
AI implements
↓
compare the result with the contract
↓
accept or redirect
```

A lot of the middle is delegated.

I still want that delegation to become broader.

But broader delegation only feels safe when the entrance says what the system means and the exit checks that the implementation preserved it.

That is why architecture became more important rather than less.

## AI lowered the cost of code — including wrong code

This is the sentence I keep coming back to.

AI reduces the cost of implementing the correct design.

It also reduces the cost of implementing the wrong design.

Both get faster.

So the scarce part moves upward:

```text
meaning
responsibility
boundaries
sources of truth
```

https://github.com/KentaroMorishita/seseragi

I expected AI coding to make architecture less relevant because more of the implementation could be automated.

In practice, the opposite happened.

**If the machine can run extremely fast, deciding where it should run becomes more important.**