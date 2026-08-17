---
title: "AI Wrote More Code, So I Started Spending More Time Writing Issues"
published: false
tags: ai, github, programming, seseragi
description: "Delegating implementation didn't remove design work. It forced me to write down scope, dependencies, invariants, non-goals, and completion criteria before the agent ran."
series:
main_image:
canonical_url:
---

A lot of Seseragi implementation is delegated to AI now.

I assumed that if I wrote less code, I would get some time back.

I did not.

One thing grew instead:

**the amount of time I spend writing GitHub Issues.**

And I do not mean turning a TODO into a longer checklist.

At this point, writing the Issue often decides a surprising amount of the implementation before any code exists.

## "Build this" stopped being enough

Take the Web scaffold.

The one-line request is:

```text
Add `seseragi new web`.
```

An AI agent can probably build something from that.

But "something" is not the target.

I wanted a scaffold that:

- uses the canonical Seseragi project contract
- does not duplicate starter projects in a second template system
- requires no unrelated package-manager ceremony
- flows directly into `seseragi dev` and `seseragi build`

That became:

https://github.com/KentaroMorishita/seseragi/issues/368

By the time those constraints are written down, a lot of the architectural solution space has already been decided.

The agent still has implementation freedom.

It no longer has permission to solve the wrong problem beautifully.

## The Issue decides where the work belongs

A project generator could be implemented several ways:

```text
maintain a second template directory
copy an existing canonical sample
embed giant strings in the CLI
invent a general generator framework
```

All of them can produce a directory that runs.

The requirement alone does not tell you which architecture you want.

So the Issue has to say things like:

```text
reuse the canonical project contract
avoid a second package model
generated output must immediately work with normal dev/build
```

At that point the Issue is no longer describing only the output.

It is describing **the acceptable shape of the solution inside this repository**.

This dramatically reduced reviews that ended with:

> Yes, it works, but I do not want that responsibility there.

## Ambiguous tasks became scarier as implementation got faster

When I am coding manually, I can notice discomfort halfway through:

```text
Why am I creating another registry?
This helper belongs somewhere else.
This abstraction is getting too broad.
```

I can stop and redirect myself.

An agent can run much faster through the same ambiguity and return a very complete result.

That is the dangerous version.

**The wrong direction can become polished before I have emotionally caught up with it.**

So I try to move more of the decision before implementation.

The Issue is where I put the fence.

## The contract section is often longer than the feature description

Many Seseragi Issue titles are boring:

```text
implement HTTP client
implement local effect fn
restore Array index access
```

The body is much longer because the important questions are:

```text
What existing semantics should this reuse?
Which registry is canonical?
What must not become a special case?
Which layers must preserve the meaning?
What counts as complete?
```

Array index access is a good example:

https://github.com/KentaroMorishita/seseragi/issues/393

The visible feature is:

```rust
values[index]
```

But the Issue says that this must have the same `Maybe<A>` semantics as existing `std/array.get`, including negative/out-of-range behavior, and must agree across CLI, WASM, Playground, formatter, tooling, and Tour.

"Implement square brackets" is not the real contract.

**"Connect another surface to this existing meaning" is.**

## The Issue outlives the original conversation

A chat instruction can be perfect and still disappear into one session.

A durable Issue can later be read by:

- another agent
- another work item
- review
- future me

That changes how I write it.

The goal is not to persuade today's model.

The goal is to leave enough project context that the next implementer understands the same boundaries.

That is why dependencies and non-goals matter so much.

## Completion criteria became more explicit too

"Works" is not a binary concept in a language toolchain.

For `seseragi dev`, a real completion contract includes things such as:

```text
initial build
watch source and manifests
rebuild
browser reload
keep server alive through compile errors
source maps
Ctrl-C cleanup
```

The implementation is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/365

Without that list, an agent can reasonably stop after:

> It serves the initial build.

Technically progress.

Not the development loop I asked for.

The acceptance criteria become the bridge from delegation back to review.

## Non-goals prevent "while we're here"

This is one of the most important sections now.

For a dev server:

```text
no HMR requirement yet
no SSR
no application router
```

For a scaffold:

```text
no general template framework
no backend matrix
no CSS integration
```

For HTTP:

```text
no hidden JSON policy
no automatic retry
no streaming in the small-response slice
```

For a pattern bug:

```text
do not special-case Maybe
```

Humans do "while we're here" too.

AI can do it very quickly.

A non-goal gives useful ideas somewhere to go: **another Issue, not this implementation.**

## The reason behind the non-goal matters

A bare statement like:

```text
do not add retry to HTTP
```

can become mysterious later.

Was retry forgotten?

Was it postponed because of time?

Was it rejected completely?

A stronger Issue says:

```text
retry policy belongs in Effect/Schedule composition rather than the core HTTP transport contract
```

Now the omission carries architecture information.

The goal is not to forbid the feature.

It is to keep the responsibility boundary visible.

## Then I started designing the order of Issues too

A perfectly written Issue can still be the wrong next Issue.

Seseragi has an orchestration item:

https://github.com/KentaroMorishita/seseragi/issues/291

It manages the order of leaf work.

Examples:

```text
JSON core
↓
JSON hotfix
↓
JSON deriving
```

or:

```text
Stream core
↓
HTTP streaming / WebSocket / DB cursor integrations
```

When AI can implement quickly, dependency order matters more because you can reach the wrong foundation quickly too.

This is the funny result of faster coding:

**more project-management-shaped design work appears in a one-person language project.**

## Prompt engineering became less interesting than problem transformation

I still care about good prompts.

But one of the largest improvements often comes from changing:

```text
"make HTTP good"
```

into:

```text
small-response HTTP only
reuse current Provider
Bytes body
no Stream / retry / JSON policy
these exact acceptance criteria
```

The model did not become smarter.

The problem became smaller and more precise.

That is closer to work decomposition than prompt magic.

## Writing Issues became a design review for myself

This is probably the biggest unexpected benefit.

I started writing all this because AI needed externalized context.

Then I noticed that while writing:

```text
why this exists
what owns it
what must remain unchanged
```

I was forcing myself to answer questions I might otherwise have resolved impulsively while coding.

The Issue becomes an architectural checkpoint before implementation.

https://github.com/KentaroMorishita/seseragi

I wanted AI to reduce the amount of engineering I had to do.

Instead, it reduced a lot of typing and made me spend more time **turning design into explicit contracts**.

So yes: I write less code now.

And somehow I write more Issues.