---
title: "GitHub Issues Started Feeling Like an IR Between Me and AI"
published: false
tags: ai, github, compilers, seseragi
description: "My vague idea doesn't go straight to the coding agent anymore. It gets lowered into scope, dependencies, invariants, and acceptance criteria first. Compiler brain noticed the resemblance."
series:
main_image:
canonical_url:
---

I am building a compiler, so apparently everything starts looking like a compiler problem.

Recently I noticed this workflow:

```text
vague idea / discomfort
↓
GitHub Issue
↓
dependencies / scope / invariants / definition of done
↓
Codex
↓
commit / PR
↓
review
```

And I had a stupid thought:

**Wait. Is the Issue becoming an intermediate representation between my brain and the coding agent?**

Obviously a GitHub Issue is not a compiler IR.

The resemblance is still annoyingly strong.

## Seseragi itself does not send source syntax directly to the backend

The compiler is roughly:

```text
Surface
↓
Resolved / Typed
↓
Core IR
↓
backend IR
↓
TypeScript
```

Seseragi currently emits TypeScript, but the backend is not supposed to decide what Seseragi source means.

The meaning is normalized before backend-specific lowering.

That boundary is one of the architectural decisions I care about most:

https://dev.to/kentaromorishita/typescript-is-a-backend-not-the-language-db9

Then I looked at my development process and saw a strangely similar move.

I do not take:

> I want HTTP.

and send that directly to Codex anymore.

That sentence has too much unresolved meaning:

```text
client or server?
small response or streaming?
Provider reuse?
JSON too?
Promise public?
retry?
```

I lower the vague request into an Issue first.

The Issue owns what the work means before the implementation backend runs.

Compiler brain approves.

## Lowering into an Issue is partly about deleting information

My head contains lots of unrelated ideas at once:

```text
I want this feature
this API looks cool
maybe later add that
another language does it this way
while I'm here I could fix this too
```

A good implementation Issue does not preserve all of that.

It throws away what does not belong to this work item:

```text
not this responsibility
separate Issue
non-goal
not decided yet
```

That is another reason the IR metaphor amuses me.

A compiler IR often erases surface distinctions that no longer matter and preserves the semantic facts needed by later stages.

An Issue similarly removes much of the brainstorming noise and keeps:

```text
this responsibility
these dependencies
these invariants
this valid completion state
```

Not every thought deserves to reach the implementation stage.

## A good Issue is more agent-independent than a chat session

One valuable property of an IR is that it separates stages.

Likewise, a durable Issue can be read by:

```text
today's Codex
tomorrow's Codex
a different model
me later
```

The implementers are not equivalent; their abilities differ.

But I do not want the definition of the job itself to depend on one session's hidden context.

The Issue moves that meaning into the repository.

That lets the agent change without forcing me to redesign the task from scratch every time.

## Prompts started looking more like invocation options

Once the real contract lives in the Issue, my actual prompt can get smaller.

Something like:

```text
Implement this Issue.
Check the related code and dependencies.
Run through the completion criteria.
```

Then the session-specific prompt can add:

```text
use this branch
start from this commit
review the result afterward
```

The important architecture is not trapped there.

In the very loose metaphor:

```text
Issue = work semantics
prompt = execution/invocation context
```

Again: not literally an IR.

Still funny.

## The Issue graph started looking like an execution plan too

Seseragi has an orchestration Issue:

https://github.com/KentaroMorishita/seseragi/issues/291

It tracks dependency-sensitive order between leaf work items.

For example:

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
HTTP streaming / WebSocket / DB cursors
```

If a hotfix appears, the order changes.

So an individual Issue describes one work item, while the graph begins to describe:

```text
which work items may execute
and in what order
```

At that point the compiler metaphor gets dangerously close to a scheduler/execution-plan metaphor.

I may need to stop building a compiler before I rename my project management artifacts to basic blocks.

## Acceptance criteria feel a little like type checking

An agent can return a lot of code and say the feature is implemented.

I still go back to the Issue:

```text
CLI behavior correct?
Playground semantics same?
module boundaries preserved?
host object still hidden?
fixtures added?
non-goals respected?
```

The code existing is not enough.

It has to inhabit the contract the Issue described.

A test suite can even be green while the architecture is invalid — for example if a second registry was added and both local paths have tests.

So there is a difference between:

```text
executable result
```

and:

```text
result valid under the project contract
```

Yes, this is where compiler brain starts saying "well-typed work item" and should probably be ignored.

## Bad lowering produces beautifully wrong output

This is where the analogy becomes useful rather than merely funny.

If a compiler lowers source semantics incorrectly into IR, a perfect backend will faithfully emit the wrong program.

Likewise, if I define the wrong Issue, a competent coding agent can produce an extremely polished wrong implementation.

Pattern binding was a good example.

The bug first appeared around nested Maybe patterns.

If I had written:

```text
Fix Maybe nested pattern.
```

then the agent could make that exact case pass.

The actual problem was that multiple pattern-binding surfaces were not sharing one semantic route.

So the Issue became a broader pattern-semantics regression:

https://github.com/KentaroMorishita/seseragi/issues/194

It required representative Maybe, Either, and user-defined generic ADT cases so the fix could not quietly collapse back into a standard-type special case.

**If the intermediate problem definition is wrong, implementation quality cannot rescue it.**

## Issue design is not lossless, and that is good

There is another important part of the metaphor.

I do not want Issues to preserve every conversation and every alternative forever.

A work item should be executable.

If the brainstorming contains three future ideas, only one may belong in the current Issue.

The others become separate nodes or disappear until they are worth deciding.

That reduction is useful.

The repository needs enough context to preserve intent, not every thought I had while walking around the room.

## But an Issue is still natural language, not a real IR

To be clear, I do **not** want a rigid machine schema for all this.

Issues contain nuance.

Humans comment on them.

Scope changes.

Some need detailed contracts; some are tiny bugs.

Turning every Issue into a formal AST would create project-management programming, which sounds like exactly the kind of new problem I do not need.

The useful middle ground is:

**structured enough for intent to survive, flexible enough for humans to keep thinking.**

## GitHub became the human/AI boundary almost accidentally

The current loop is increasingly:

```text
my design discomfort
↓
GitHub Issue
↓
AI implementation
↓
PR / commit
↓
my review
↓
main
```

The human idea does not go directly to the agent.

It passes through a repository artifact that other work can reference later.

That means the project remembers why something exists even after the original session is gone.

https://github.com/KentaroMorishita/seseragi

I started creating Issues because I did not want to forget TODOs.

Now I feel uncomfortable sending a large undefined task directly to AI without lowering it into an Issue first.

I was already building Core IR to keep source semantics separate from the backend.

Somehow my development process grew its own weird little IR next to it.

**Apparently once you start thinking in compiler pipelines, nothing is safe.**