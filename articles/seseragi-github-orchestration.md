---
title: "I'm Building It Alone, but My GitHub Issues Started Looking Like an Org Chart"
published: false
tags: ai, github, programming, seseragi
description: "Issues stopped being a TODO list and became the control plane for what gets implemented next, what waits, and what interrupts the queue."
series:
main_image:
canonical_url:
---

Seseragi is basically a one-person programming-language project.

And yet when I open GitHub lately, the project starts looking like this:

```text
architecture / local Web foundation
  ✓ runtime capability spec
  ✓ standard module source of truth
  ✓ seseragi dev
  ✓ project commands
  ✓ seseragi new web

browser Web application surface
  ✓ Bytes / UTF-8
  ✓ JSON core
  □ JSON hotfix
  □ JSON deriving
  □ HTTP client

first full-stack vertical slice
  □ resource scope
  □ HTTP server
  □ PostgreSQL
```

That does not look like a scratchpad anymore.

**GitHub Issues became the control plane for deciding what is allowed to move toward `main` next.**

## The problem was not the number of TODOs. It was the order.

I want HTTP.

But before HTTP, I want the host-I/O responsibility boundary clear.

I want JSON deriving.

But after merging JSON core, I found runtime details I wanted to repair first.

I want WebSocket and HTTP streaming.

But both depend on a real Stream contract.

Once dependencies start crossing feature categories, a flat backlog stops answering the most important question:

> What should run **now**?

That is why this Issue became central:

https://github.com/KentaroMorishita/seseragi/issues/291

It is not itself a feature.

It orchestrates the leaf Issues that are.

Somehow my homemade language grew an orchestration layer in GitHub.

## I separated "what family is this?" from "what runs next?"

This turned out to matter a lot.

An Epic answers:

```text
Which larger responsibility does this work belong to?
```

The execution queue answers:

```text
In what order should we deliver the current work?
```

Those are not the same graph.

HTTP streaming and WebSocket may belong to different roadmap groupings while sharing a hard dependency on Stream core.

CLI or LSP work may interrupt a feature family because finishing the local-development entrance creates more value right now.

I originally thought parent-Issue checkbox order would be enough.

It was not.

**Category and execution order are different dimensions.**

So #291 became the source of truth for the latter.

## JSON hotfix was the clearest example

The planned order was simple:

```text
#292 JSON core
↓
#293 JSON deriving
```

#292 merged.

Then post-merge review found three things I did not want to build on top of:

- extreme exact-Int conversion behavior
- Record decoding complexity
- an `Either` decode error path losing location

So I created:

https://github.com/KentaroMorishita/seseragi/issues/392

and rewrote the execution order:

```text
#292 JSON core
↓
#392 hotfix
↓
#293 deriving
```

That was the moment the roadmap stopped feeling like a plan I was supposed to obey.

It became a record of the **best current decision**.

New information arrived, so the graph changed.

## AI speed made small lookahead more valuable

#291 also started carrying a little lookahead.

Not "design the next five years."

Just look a few real Issues ahead.

Suppose the current Issue could be finished quickly by creating a feature-specific table.

If the next two already-known Issues need the same semantic data, maybe that table should be part of the existing source of truth instead.

The opposite mistake is over-generalizing everything because future work *might* need it.

So the useful window is small:

**Look at the next concrete dependencies, not imaginary future requirements.**

That has been surprisingly effective with AI because the agent can implement a local workaround so quickly that you otherwise notice the duplication only after several more Issues land.

## More agents did not mean more parallelism

Once I could run several coding agents, the obvious thought was:

> Great. Give ten Issues to ten agents.

Compiler work punishes that idea quickly.

Two Issues that look unrelated at the product level may touch the same semantic seam:

```text
A changes module-interface metadata
B consumes that metadata in instance resolution
```

Run both against the same old `main`, and one can become obsolete before it finishes.

Even worse, two agents may create two separate mechanisms for the same meaning without producing a Git merge conflict at all.

So #291 is basically single-lane by default.

Only clearly independent work gets another lane.

The goal is not 100% agent utilization.

It is preserving the causal order of changes reaching `main`.

## Git conflicts are easier than semantic conflicts

If two agents edit the same lines, Git complains.

That is nice.

The more dangerous conflict is:

```text
Agent A creates one standard-trait registry
Agent B creates another operator-specific standard-trait table
```

Different files.

Both test suites green.

Architecture now has two truths.

Seseragi has already experienced the kind of hole this creates: standard `Eq<Int>` could work through an operator path while generic `where Eq<A>` evidence did not see the same instance.

That is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/394

So parallelism is not only a question of:

> Do these Issues touch the same files?

It is:

> **Do they touch the same meaning?**

That is a much more expensive scheduler.

## Checkbox state became project state

When a leaf Issue closes but #291 still says it is pending, that is no longer harmless UI drift.

The queue uses the orchestration state to choose what comes next.

So one delivery cycle becomes:

```text
implement leaf Issue
↓
merge to main
↓
verify close/completion
↓
synchronize #291 queue state
↓
deliver next Issue
```

The checkbox stopped being decoration.

It became part of the control plane.

That sounds ridiculous for a one-person hobby language.

It also prevents me and the agents from scheduling work against stale assumptions.

## I did not copy an enterprise process into a solo project

Epic.

Dependencies.

Execution queue.

Hotfixes.

Lookahead.

Those words sound like organizational process.

I did not start with a desire to recreate a software department for myself.

The structure appeared because the number of **implementation actors** increased.

When I personally wrote everything, the current order could live in my head.

Once several agents could implement independently, shared state needed to leave my head:

```text
What is canonical?
What is blocked?
What changed the queue?
What runs next?
```

The organization-like shape was a consequence of delegation, not a goal.

## GitHub was already almost enough

I did not build a custom agent orchestrator.

GitHub already had:

```text
Issues -> durable work boundaries
PRs -> diffs and review
commits -> concrete main state
close state -> completion
links -> dependency/context graph
```

Using those artifacts for AI delivery turned GitHub into a combination of:

```text
design memory
+
execution queue
+
completion state
+
review history
```

I am glad I did not respond to a programming-language project by immediately building another project-management tool too.

One absurdity at a time.

## My work moved from coding toward routing

The current human loop is increasingly:

```text
decide what should exist
split responsibility
write Issues
choose order
send work to agents
review results
merge
advance queue
```

The coding work did not disappear.

A lot of it moved into Codex.

What remained on my side started looking strangely like an engineering organization even though the organization is still mostly me and a set of agents.

https://github.com/KentaroMorishita/seseragi

I started using Issues so I would not forget things.

Now a large Issue that is not represented in the execution graph feels risky to start at all.

**I did not add project orchestration because the project became big. It became necessary because implementation became parallelizable.**