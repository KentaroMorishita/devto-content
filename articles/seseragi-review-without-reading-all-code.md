---
title: "I Can't Read Every Line AI Writes, So I Review the Meaning First"
published: false
tags: ai, codereview, programming, seseragi
description: "When AI can produce large compiler diffs quickly, line-by-line review stops scaling. I still need to know whether the right semantics reached the right layer."
series:
main_image:
canonical_url:
---

Codex writes a lot of Seseragi now.

Sometimes the diff is large.

Rust compiler code.

Fixtures.

Runtime changes.

Documentation.

If my review strategy were:

> Read every changed line with the same intensity before accepting anything.

then AI implementation speed would mostly turn into a larger review queue.

So my review style changed.

**I do not start from every line. I start from whether the result still means the thing I asked for.**

## The Issue is the first review document

Before implementation, a Seseragi Issue often already says:

```text
why this exists
dependencies
source of truth
scope
invariants
non-goals
definition of done
```

So when an agent says "done," I go back there first.

Did the public surface match?

Did the implementation reuse the intended source of truth?

Did a backend concern leak upward?

Did a supposedly local change create a second runtime path?

Did the non-goals stay out?

This is a different first pass from asking whether every helper function is elegant.

If the architecture is wrong, local elegance does not save it.

## I review the seam where the Issue was supposed to land

Suppose the task is an Array index surface:

```rust
values[1]
```

The contract says it should have exactly the same safe `Maybe<A>` semantics as `std/array.get`.

I care about the seam:

```text
syntax
↓
typing
↓
existing Array get meaning
↓
lowering/runtime
```

I want to see that the new surface connects to the same concept instead of inventing a second version of index access.

That matters more to me initially than the exact names of every new Rust helper.

The corresponding work item makes this contract explicit:

https://github.com/KentaroMorishita/seseragi/issues/393

## User-visible behavior is a very strong review tool

I spend a lot of time trying the result.

Playground.

Tour sample.

Formatter.

Error messages.

Build output.

The code can look reasonable and still feel wrong immediately when used.

This is especially true in a programming language because the product **is** a set of small semantic and syntactic decisions.

A change can pass tests while making the source suddenly noisy or inconsistent.

So I keep asking:

> Does this still feel like Seseragi?

That sounds subjective because part of it is.

I am the language designer. Some final consistency decisions really are design taste.

## Tests tell me facts. They do not tell me all the architecture.

I rely heavily on tests.

Conformance fixtures are crucial.

But two wrong subsystems can each have excellent tests.

The standard-instance gap is a good example:

https://github.com/KentaroMorishita/seseragi/issues/394

Integer equality could work through one operator path while generic `where Eq<A>` evidence failed through another.

Each local route could be tested.

The architectural bug was that there should be **one language-level Eq capability**, not two almost-equivalent truths.

So I look for cross-route equivalence too:

```text
operator
named method
generic constraint
imported use
```

must agree where the language says they mean the same thing.

## Large generated diffs made responsibility boundaries more valuable

If I know:

```text
this Issue is backend-only
```

then I can be suspicious of new source-semantics changes.

If the task is a Provider adapter, I can be suspicious of public language types changing just to accommodate host machinery.

If the Issue says "reuse the canonical registry," a brand-new local lookup table is immediately interesting.

Architecture turns a giant diff into a set of questions.

Without those boundaries, reviewing AI code would mean reconstructing the intended architecture from the diff every time.

That does not scale.

## I still read code. I just do it asymmetrically.

This is not "trust AI and only click the buttons."

I read code where the risk is concentrated:

- public contracts
- compiler representation boundaries
- new registries
- effect/cancellation/resource behavior
- generic evidence
- tricky algorithmic paths

A mechanical fixture update may get less attention than a new route through Core IR.

A generated documentation snapshot may get less attention than one line that changes what `Signal` means.

**Review depth follows semantic risk, not line count.**

That is the only way I can keep up with the implementation throughput.

## The easiest review is when the Issue is small enough

If a PR changes parser, type checker, runtime, CLI, dev server, and standard library policy at once, no review technique makes that pleasant.

So a lot of review quality is decided before the code exists.

Split the work.

Keep one responsibility visible.

Name the source of truth.

Write non-goals.

Then the review can ask one coherent question.

AI did not only change how I review code.

It made **work decomposition part of review design**.

## I use another AI pass too, but I do not outsource the final taste

A second agent can inspect a diff and find:

- suspicious duplication
- missing edge cases
- inconsistent contracts
- test gaps

That is useful.

But I still keep the final decision on things like:

```text
this syntax is too noisy
this responsibility is in the wrong layer
this convenience hides meaning I want visible
this special case should be ordinary composition instead
```

Those are not always derivable from the codebase alone.

They are part of the direction I am choosing for the language.

## The final review question is not "did AI write good Rust?"

It is closer to:

```text
Did this change preserve the language meaning?
Did it put the meaning in the correct layer?
Did it avoid creating another truth?
Does the public surface still feel coherent?
```

If those answers are good, then I can zoom into the risky code and verify the implementation details.

https://github.com/KentaroMorishita/seseragi

AI made it possible for this compiler to grow much faster than I could hand-write it.

That also made line-by-line uniform review impossible as the main control mechanism.

So I changed the unit of review.

**I still review code. I just try to review the meaning before I review every line that happened to implement it.**