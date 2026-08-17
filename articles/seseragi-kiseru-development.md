---
title: "My Development Workflow Started Looking Like a Kiseru Pipe"
published: false
tags: ai, codex, programming, seseragi
description: "Human at the entrance, AI through the middle, human again at the exit. That shape has become the fastest way I know to build Seseragi."
series:
main_image:
canonical_url:
---

Seseragi development has taken on a strange shape lately.

I am not implementing everything myself.

I am also not telling AI:

> Build the language however you think is best.

The actual flow looks more like:

```text
decide what should exist
↓
turn it into an Issue
↓
AI implements it
↓
inspect the result
↓
if it feels wrong, send it back
↓
merge to main
```

**AI occupies the middle.**

The entrance and exit are still human.

It started reminding me of a *kiseru* — the traditional Japanese pipe with solid pieces at both ends and a long hollow stem through the middle.

## I hold the entrance

Before an agent starts, I decide things such as:

```text
what are we actually building?
why does it belong in the language?
what existing meaning should it reuse?
which layer owns it?
what are the non-goals?
when is it finished?
```

For an HTTP client, that might become:

```text
small response only
reuse the existing Provider
body is Bytes
JSON is separate
retry is separate
host objects do not leak publicly
```

I do not want the AI to infer those decisions from general ecosystem conventions.

A completely reasonable TypeScript answer can be the wrong Seseragi answer.

The Issue is where I fix that meaning before implementation starts.

## Then I hand over a lot of the middle

Once the work item is bounded, I delegate aggressively.

The agent can:

- inspect parser/runtime/compiler code
- implement the change
- wire Typed HIR and Core IR
- update lowering
- add fixtures
- update docs
- iterate on failures

If I hand-wrote every Rust change myself, Seseragi would not move at its current speed.

Codex is fast, and it is good at Rust.

I do not pretend I personally track every lifetime detail of every function it changes.

What I try to keep firmly in my head is different:

```text
this meaning belongs here
this layer should not know that
this registry is canonical
this public surface must remain this shape
```

That is enough to delegate a surprising amount of implementation without delegating the identity of the language.

## I also hold the exit

"Implemented" is not the end of the pipe.

I go back to the Issue.

I try the Playground.

I inspect Tour samples.

I look at errors and formatter output.

I check whether responsibilities moved to strange places.

Sometimes the result is technically solid and my reaction is still:

> No, that's not it.

Maybe the syntax became noisy.

Maybe a convenience hides a distinction I wanted visible.

Maybe another special case appeared where normal function/value composition was enough.

Maybe the feature works but does not feel like Seseragi.

That final veto remains human.

## This changed my idea of what "I built this" means

After years as an engineer, there is a strong instinct:

```text
I wrote the code
=
I built the thing
```

So when AI started producing more of Seseragi's code, I had a weird moment:

> Am I actually making this language if I am not typing most of the implementation?

Then I looked at the decisions that define the language:

```text
null or Maybe?
Signal Monad or no Monad?
Promise visible or Effect boundary?
Record vs Struct?
What does Array index return?
What belongs in Core vs backend?
```

If those decisions changed, the language would become a different language even if every Rust line were beautifully written.

So I stopped measuring authorship by keystrokes alone.

**The person deciding meaning is doing real construction too.**

## AI in the middle made the entrance more important

When I implement manually, I can discover architectural discomfort while writing code.

I can stop halfway and say:

> Actually, this responsibility is wrong.

An AI agent can receive an ambiguous Issue and sprint to a polished result before I have that mid-implementation moment.

That made the entrance more important.

I write more detailed work boundaries now precisely because the middle is faster.

The faster the implementation lane becomes, the more expensive a vague starting direction becomes.

## Clear architecture makes the hollow middle possible

If the repository were one giant blob of compiler/runtime logic, I could not safely hand over large pieces and hope to review only the output.

The codebase needs recognizable boundaries:

```text
Surface
Typed
Core
backend
Provider
product/tooling surface
```

Then the Issue can say which boundary owns the work.

I can delegate inside it.

I can review whether it crossed the wrong boundary.

**I can leave more of the middle to AI because the middle is divided into responsibilities.**

That is the part that makes the kiseru shape practical rather than merely lazy.

## The human job did not disappear. It changed shape.

My direct coding time decreased.

Other work increased:

```text
write Issues
inspect dependencies
route work to agents
review results
change roadmap order
merge
```

So I did not automate myself out of the project.

I turned into a strange mixture of:

```text
language designer
architect
scheduler
reviewer
product owner
```

all in one person.

A solo hobby project started feeling oddly organizational because the implementation capacity stopped being one pair of hands.

## The most futuristic part may be how casually the middle keeps moving

I can send an Issue to Codex.

Leave the computer.

Look again later from my phone.

The implementation exists.

I can inspect the contract and diff, ask for corrections, or merge it.

My physical typing time and project implementation time are no longer the same clock.

That changed the speed of Seseragi dramatically.

But it only works because I do not let "the agent is still running" become equivalent to "the project is going in the right direction."

The human still owns the entrance and exit.

## The last "this feels wrong" is difficult to formalize

AI can read the specification.

It can compare existing patterns.

It can review architecture.

And still, after using the language for a while, I have a residual test that looks like:

```text
Is this too noisy?
Is this special case really necessary?
Did we hide too much meaning?
Does this feel like the same language?
```

I cannot reduce all of that to unit tests.

Some of it is the accumulated aesthetic/semantic direction of the project.

That is the final part I am least willing to automate away.

## The interesting question is not what percentage AI writes

AI coding discussions often turn into:

> What percentage of the code did the model write?

I do not find that number very useful anymore.

The boundary that describes my workflow better is:

```text
entrance
  -> human decides meaning

middle
  -> AI does much of the implementation

exit
  -> human checks meaning and accepts/rejects
```

Not fully manual.

Not autonomous either.

https://github.com/KentaroMorishita/seseragi

**Decide the meaning, let the implementation flow, then verify the meaning again.**

It really does look like a kiseru pipe now.

And so far, it is the fastest shape I have found.