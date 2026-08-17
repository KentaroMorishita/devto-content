---
title: "I Added More Codex Agents and Became a Human Load Balancer"
published: false
tags: ai, codex, github, seseragi
description: "The bottleneck stopped being how many agents I could run. It became deciding which jobs were actually independent enough to run together."
series:
main_image:
canonical_url:
---

A large amount of Seseragi implementation runs through Codex now.

At first the idea was simple:

> If AI does more implementation, maybe I get to relax a little.

I do write much less code directly.

Something else replaced it:

**Which Issue should go to which agent, and when?**

Somehow I became a human load balancer.

## More agents did not mean every Issue became parallel

If I can run five or ten agents, the obvious speed trick is to keep all of them busy.

Compiler work makes that dangerous.

Two Issues can have completely different titles and still meet at the same seam:

```text
Issue A
  -> changes generic metadata in module interfaces

Issue B
  -> reads imported instance evidence from module interfaces
```

If A changes the contract while B is already finishing an implementation against the old contract, both agents can do excellent work and still create rework.

**AI makes good parallelism faster. It also makes bad parallelism faster.**

So the first scheduling question is not:

> Which agent is idle?

It is:

> Are these two jobs actually independent?

## The thing I balance is responsibility, not CPU

A normal load balancer can often send the next request to an available server.

My version looks more like:

```text
Which compiler layer does this touch?
Does another active Issue modify the same source of truth?
Does this depend on the previous merge?
Can it safely live in another lane?
```

An idle agent may stay idle if the next work depends on a change that has not landed yet.

Another Issue may run in parallel if it touches a genuinely separate layer.

So "load balancing" is not really the right term.

It is closer to semantic traffic control.

Unfortunately "human semantic traffic controller" sounds even worse.

## #291 became the traffic light

The execution-order source of truth is:

https://github.com/KentaroMorishita/seseragi/issues/291

The default is effectively one lane.

Clearly independent work can branch out.

That default surprised me.

If multiple agents are available, single-lane development feels wasteful.

In practice, maximizing agent utilization often created more merge/review pressure than useful throughput.

The metric that mattered was not:

```text
How many agents are currently busy?
```

It was:

```text
How quickly can correct, causally ordered changes reach main?
```

Those are very different optimization targets.

## Code conflicts are easier than design conflicts

Git will tell me if two agents edit the same lines.

The worse conflict is when both implementations merge perfectly.

For example:

```text
Agent A adds standard trait data to one registry
Agent B adds operator-specific standard trait data somewhere else
```

No merge conflict.

Both local test suites pass.

The project now has two truths.

Seseragi has seen the kind of problem that produces. Standard `Eq<Int>` could work through an operator-specific path while generic code requiring `where Eq<A>` could fail to receive the corresponding first-class evidence:

https://github.com/KentaroMorishita/seseragi/issues/394

That taught me that parallelism has to consider:

**Do these work items touch the same semantic fact?**

not merely:

**Do they touch the same file?**

## A hotfix can stop an available agent on purpose

JSON made this very concrete.

The planned sequence was:

```text
JSON core
↓
JSON deriving
```

Then post-merge review found exact-number, complexity, and error-path issues in the core.

That became:

https://github.com/KentaroMorishita/seseragi/issues/392

The queue changed to:

```text
JSON core
↓
hotfix
↓
JSON deriving
```

If another agent had already started deriving against the unrepaired seam, I would have built more code on top of a known weak foundation.

So even with capacity available, I stop delivery.

Wait for the premise to stabilize.

Then continue.

**Unused AI capacity is cheaper than polished work built on a premise I already distrust.**

## Review throughput became the real backpressure

There is another hard limit: me.

Suppose five large PRs finish at once.

The implementation throughput is great.

The review throughput is not.

```text
agent implementation throughput
>
human architectural review throughput
```

Now completed work sits in a queue.

While it waits, `main` keeps moving and the PR's assumptions get stale.

So I increasingly schedule based on how much change I can actually understand and merge, not how many agents I can keep occupied.

This is especially funny because Seseragi's own Stream roadmap has explicit backpressure semantics.

Apparently my Codex operation needed backpressure before `std/stream` did.

## Issues became the packets I route

I do not want to re-explain the full job every time I dispatch it.

So work gets lowered into a GitHub Issue first:

```text
purpose
dependencies
scope
non-goals
completion criteria
```

Then my loop becomes:

```text
create/adjust Issue
↓
choose lane
↓
assign to agent
↓
review result
↓
merge
↓
advance queue
```

The agent handles the packet.

I decide the route and merge point.

I wrote about the "Issue as an IR" metaphor here too, because apparently compiler brain has infected the workflow itself.

## More agents changed my job, not only the speed

The current rough division is:

```text
human:
  decide meaning
  split responsibilities
  sequence work
  review architecture

AI:
  inspect repository
  implement bounded Issue
  add tests/docs
  iterate on failures
```

That division is not absolute.

AI can review architecture too, and I still inspect code.

But the center of gravity shifted.

I expected more implementation capacity to reduce my role.

Instead it moved my role toward scheduling and integration.

## Round-robin would be much easier

It would be nice if the policy were:

```text
Agent 1 free -> Issue 1
Agent 2 free -> Issue 2
Agent 3 free -> Issue 3
```

Nope.

The scheduler has to understand enough architecture to know where work can collide without a visible merge conflict.

So adding agents does not remove the need to understand the system.

It increases the value of understanding it at the level of responsibilities and dependencies.

https://github.com/KentaroMorishita/seseragi

I added more Codex agents and somehow became the load balancer.

And of course the load balancer cannot use round-robin because the requests have semantics.

Why am I doing traffic control for a homemade programming language?