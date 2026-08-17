---
title: "The Scariest AI Code Isn't Sloppy. It's Beautifully Wrong."
published: false
tags: ai, programming, architecture, seseragi
description: "A bad design can arrive with clean modules, tests, docs, and error handling. That makes it harder to notice — and much harder to throw away."
series:
main_image:
canonical_url:
---

Before I started using AI heavily for implementation, I assumed the main risk would be bad code.

Weird names.

Duplication.

A giant function.

Special cases everywhere.

Missing tests.

After building a lot of Seseragi with coding agents, I found something I am much more afraid of:

**the wrong architecture, implemented extremely well.**

## Ugly code is often easier to reject

If an AI gives me:

```text
confusing names
three copies of the same logic
obvious hacks
no useful tests
```

I notice quickly.

Recent coding agents are often pretty good at avoiding this category anyway.

The harder failure looks like:

```text
responsibility placed in the wrong layer
↓
clean module structure
↓
solid unit tests
↓
integration tests
↓
good error handling
↓
documentation updated
```

The implementation quality is high.

The premise is wrong.

That is much more dangerous because quality can hide the mistake.

## "It works" and "it belongs here" are separate questions

Take an HTTP client.

For a TypeScript backend, a direct path from generated code to host `fetch` is completely reasonable if the goal is simply to make requests work.

The browser sends the request.

Tests pass.

Done.

Except Seseragi deliberately wants host I/O behind:

```text
std/http
↓
HttpClient capability
↓
Provider contract
↓
host adapter
```

The host is allowed to use `fetch`.

The source language should not become defined by browser `Request`, `Response`, Promise, or AbortController.

If an agent builds the direct-fetch route beautifully, I still have to delete it.

And deleting good code feels much harder than deleting obvious junk.

## The old TypeScript compiler showed me a slower version of the same failure

Seseragi's first implementation was written in TypeScript.

It was fast to grow.

That speed was real and valuable.

As the language expanded, the architecture gradually became harder to reason about:

```text
Where is this type meaning defined?
Which special case is canonical?
Why is backend behavior visible up here?
Why do two routes encode the same concept differently?
```

No single commit had to be catastrophically bad.

The codebase could accumulate locally sensible decisions until the responsibility map stopped being sensible globally.

That experience is one reason I rewrote the compiler in Rust and, more importantly, separated Surface, resolution, typing, Core, backend IR, and runtime provider concerns more deliberately.

## Rust did not magically make AI safer

An agent can build the wrong abstraction in Rust just as efficiently.

The helpful change was not the implementation language alone.

It was having architecture strong enough that review can ask:

```text
Does this belong in Core?
Is this backend-only?
Is this the canonical registry?
Should this be a Provider concern?
```

Those questions catch a category of mistake that code-style review cannot.

## AI is extremely good at local optimization

The agent is trying to finish the task I gave it.

That is usually what I want.

If the repository's source of truth is unclear, a locally sensible implementation may be:

```text
add a helper specific to this feature
add a small registry next to it
add another adapter path
write tests for the new path
```

The Issue becomes green.

The system gains another semantic route.

This is not AI behaving stupidly.

It is AI behaving competently inside an underspecified architectural problem.

That distinction matters.

## Tests can make the wrong architecture feel even safer

Seseragi has a real example around standard trait evidence.

A standard `Eq<Int>` path could support integer operators while generic code requiring:

```rust
where Eq<A>
```

failed to obtain the same evidence.

That gap is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/394

Each route can have passing tests.

The bug is that there should not be two semantic truths in the first place.

The stronger regression test is cross-cutting:

```text
operator
named trait method
generic constraint
```

must all observe the same instance identity.

**Architecture invariants need tests too.**

A large pile of local coverage does not prove that two locally correct subsystems should both exist.

## AI can generate sunk cost at machine speed

This is a surprisingly psychological problem.

If I wrote a rough prototype in twenty minutes, throwing it away is easy.

If an agent returns:

```text
implementation
tests
documentation
error handling
clean module boundaries inside its chosen design
```

then the code feels finished.

Even if it appeared quickly, I catch myself thinking:

> But this is already so complete...

That is dangerous.

The implementation cost may be cheap, but the **perceived sunk cost** arrives fully packaged.

So I increasingly review the route before I let completeness influence me.

The question is:

> If this implementation were only twenty lines, would I still believe this responsibility belongs here?

If the answer is no, the polished version should go too.

## This is why my Issues contain so many non-goals now

A work item may explicitly say:

```text
do not create another registry
do not add another Provider engine
do not mix JSON policy into HTTP
do not change Core semantics for a backend-only bug
```

Those statements can look overly specific if you think of the Issue only as a coding instruction.

I think of them as the design boundary.

Anything I leave undecided is space the implementation can legitimately fill.

And AI is very capable of filling that space.

So I want the important architectural freedom decided before the agent begins.

## The human review target moved upward

I still inspect implementation details.

But the first questions are now:

```text
Is the responsibility correct?
Did we duplicate a source of truth?
Did host behavior leak upward?
Did we create a parallel route?
Did the public contract change without intending to?
```

Only after that do I care whether one helper could be renamed more elegantly.

That shift is interesting.

As AI becomes better at writing locally good code, human review becomes more valuable at the level the agent cannot infer from one narrow task: **the intended shape of the whole system.**

## The scary outcome is success in the wrong direction

I used to worry:

> What if AI produces broken code?

Now I worry more about:

> What if it produces excellent code for the wrong architecture?

Broken code usually fails loudly.

A polished wrong architecture can pass tests, look professional, and become depended on by more code before anyone notices the problem.

https://github.com/KentaroMorishita/seseragi

That is the uncomfortable lesson I took from AI-heavy implementation:

**A competent agent can run much farther in the wrong direction than an obviously bad one.**

The solution is not to make the agent slower.

It is to decide the direction before it starts running.