---
title: "The Most Important Part of My AI Coding Workflow Isn't the Prompt. It's the Issue."
published: false
tags: ai, github, programming, seseragi
description: "Prompts help one agent session. A good Issue keeps the design, scope, dependencies, non-goals, and definition of done inside the project."
series:
main_image:
canonical_url:
---

Conversations about AI coding tend to become conversations about prompts.

How should you phrase the request?

What system instructions help?

Which magic wording makes the model smarter?

Those things matter.

But after running Seseragi as a long AI-heavy project, something else became more important to me:

**the GitHub Issue.**

## A prompt helps this run. An Issue survives the run.

Suppose I tell an agent:

> Implement the HTTP client.

During the conversation I can add context:

```text
reuse the existing Provider
keep JSON separate
no retry yet
do small responses only
```

Great. That agent now understands the job.

Three days later, another agent works on the HTTP server.

Later, WebSocket work depends on the same Provider boundary.

A month later, I ask myself why retry was deliberately excluded.

The chat is a poor place to store those decisions.

An Issue can keep:

```text
why this exists
dependencies
scope
architecture constraints
acceptance criteria
non-goals
```

inside the repository.

**A prompt is execution context. An Issue is project memory.**

The longer the project lives, the more valuable that difference becomes.

## What I need from AI is a bounded job, not merely a clever instruction

Even a small phrase such as "HTTP client" contains many design decisions:

```text
client only or server too?
small response or streaming?
reuse Provider or create another engine?
JSON helpers?
retry?
Promise visible in the public surface?
what counts as complete?
```

AI can choose reasonable defaults.

That is exactly the problem.

The reasonable default for a TypeScript Web library may be wrong for Seseragi.

For example, a convenient `getJson` helper is perfectly sensible in many libraries.

Seseragi currently wants HTTP, JSON decoding, and retry policy to remain separate meanings that can be composed.

That is a project decision, not something I want the agent to infer from general ecosystem habits.

The Issue is where that decision lives.

## The Issues slowly turned into small specifications

Current Seseragi Issues often contain sections like:

```text
Goal
Dependencies
Scope
Design constraints
Tests / conformance
Definition of done
Non-goals
```

Some also name the existing source of truth or the architecture layer that must own the change.

This is not because I enjoy writing gigantic prompts.

It is because the work item itself deserves a durable boundary.

Implementation can refer back to it.

Review can refer back to it.

Other Issues can link to it.

A hotfix can interrupt the order without erasing why the original work existed.

## Writing an Issue and writing a prompt started to feel different

They are both natural language, so I originally treated them almost the same.

Now I think of them differently.

A prompt says:

```text
What should this agent do now?
```

An Issue says:

```text
What is this work?
What meaning must it preserve?
Where does it sit in the project?
What state counts as complete?
```

That means the Issue does **not** need to micromanage every implementation step.

I can fix the architectural invariants and leave local code choices to the agent.

**Define the problem shape, not every keystroke.**

That has worked much better than trying to encode the entire implementation as prose.

## Non-goals turned out to be surprisingly powerful

When I delegate a task, writing what should happen is obvious.

What made a bigger difference than I expected was writing what should **not** happen.

For an HTTP client:

```text
no streaming yet
no WebSocket
no JSON convenience layer
no implicit retry
reuse the existing Provider engine
```

AI is helpful.

If the scope is vague, it can helpfully expand it.

In a large codebase, "helpfully expand it" is often how one Issue quietly becomes three architectural decisions.

A non-goal is not merely a prohibition for the current agent.

It documents intent for later work too.

When streaming is absent after #295, we know it was separated deliberately rather than forgotten.

## Acceptance criteria turn directly into review

The completion section is equally useful.

A work item might require:

```text
works in CLI
same semantics in Playground
host objects do not leak publicly
formatter remains stable
conformance fixture exists
```

When the agent says "done," I do not need to invent a review checklist from memory.

The Issue already says what done means.

This matters because AI can make something look extremely complete very quickly.

Without explicit criteria, "it seems finished" becomes dangerously persuasive.

**The definition of done belongs in the repository too.**

## #291 became an Issue that delivers other Issues

Seseragi has an orchestration Issue:

https://github.com/KentaroMorishita/seseragi/issues/291

It is not merely a backlog list.

It tracks which leaf work items should run next and how dependencies change that order.

If a hotfix appears, it can interrupt the queue.

If one seam is about to be touched by several Issues, the ordering can be adjusted.

So the development loop starts to look like:

```text
write bounded Issue
↓
place it in the dependency graph
↓
deliver it to Codex
↓
review result against contract
```

If the prompt controls one agent invocation, #291 is closer to the control plane deciding **which durable work item gets invoked next**.

For a one-person project, this is slightly absurd.

It also works.

## A good Issue can survive a change of agent

This may be the most practical advantage.

A prompt optimized for today's conversation may depend heavily on hidden context.

A good Issue should make sense to:

```text
today's Codex
tomorrow's Codex
a different model
me three weeks later
```

Pattern binding was a good example.

The bug first looked like a Maybe/nested-pattern problem.

The Issue explicitly prevented the work from shrinking into a Maybe special case. It required the same semantic route to hold for Either and user-defined generic ADTs too:

https://github.com/KentaroMorishita/seseragi/issues/194

That design survives the agent session.

The repository remembers that the real bug was shared pattern semantics.

## Work decomposition beat prompt engineering more often than I expected

When an AI implementation goes wrong, the temptation is to ask:

> How should I prompt it better?

A lot of the time, my better question is now:

```text
Was this work item too large?
Were two responsibilities mixed together?
Was a dependency missing?
Was the definition of done vague?
Should this have been two Issues?
```

The same model often performs much better when the job is shaped correctly.

That is not a mysterious AI technique.

It is project and architecture work.

## Prompting still matters. It just moved later in the pipeline.

I still give execution instructions.

Which branch?

Which commit?

Should the agent review existing Issues first?

Should it implement and then self-review?

Those things belong in the prompt/session.

The lasting design does not.

I increasingly want that on GitHub before the session begins.

https://github.com/KentaroMorishita/seseragi

I started by thinking about how to make the AI remember more context.

The more reliable answer was often simpler:

**Do not make the AI be the only place where the project remembers its decisions.**