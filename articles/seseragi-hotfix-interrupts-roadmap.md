---
title: "The Roadmap Said 'JSON Deriving.' Review Said 'Not Yet.'"
published: false
tags: ai, github, programming, seseragi
description: "The next Issue was ready. Then post-merge review found a weaker foundation, so I deliberately interrupted the queue with a hotfix."
series:
main_image:
canonical_url:
---

The roadmap was moving cleanly.

JSON core was implemented.

Next: JSON deriving.

Then HTTP client.

```text
JSON core
↓
deriving
↓
HTTP client
```

After the merge, I did a slightly deeper review of the JSON runtime and found several things I did not want to build on top of.

So I stopped the queue.

**The roadmap said "next." The code said "not yet."**

## Exact Int decoding had a path that made me nervous

Seseragi keeps JSON numbers lossless before decoding them into a target language type.

That avoids making JavaScript `number` the definition of JSON integer semantics.

So far, good.

Then I looked at extreme exponent handling.

An input such as:

```text
1e1000000000
```

should be rejected as outside Seseragi's safe `Int` range without attempting ridiculous allocation work along the way.

The question was no longer only:

```text
Does the decoder eventually return the correct error?
```

It was:

```text
Can it reject the invalid value without constructing something enormous first?
```

That is the kind of edge case that becomes much more important when the path is about to be reused by generated codecs everywhere.

## Record decoding also looked too expensive

If structural Record decoding scans a JSON object separately for every expected field, the path can become quadratic as field counts grow.

For a tiny hand-written example, who cares?

For a core codec that compiler-generated deriving will reuse repeatedly, I care.

That changed the timing of the fix.

```text
slow-ish core path
+
automatic codec generation
=
spread the slow path everywhere
```

I wanted the foundation repaired before the next feature amplified it.

## Error-path quality mattered too

JSON decode errors should preserve where the failure occurred.

For nested data, this:

```text
$.user.address.zip
```

is much more useful than:

```text
decode failed
```

One `Either` unknown-tag path was losing the `tag` field location and recreating the failure at the root.

Again, the decoder still failed.

The problem was the contract around the failure.

And again, deriving was about to reuse that path more broadly.

The three repairs became:

https://github.com/KentaroMorishita/seseragi/issues/392

As of this draft, #392 is still open.

## I changed the execution graph, not the completed Issue

The original JSON core Issue was complete.

I did not want to pretend it had never been completed just because later review found the next repair.

So the sequence became:

```text
#292 JSON core
↓
#392 post-merge hotfix
↓
#293 JSON deriving
```

The implementation order source of truth lives in:

https://github.com/KentaroMorishita/seseragi/issues/291

That queue changed too.

This distinction became important to me:

```text
previous work completed its scope
```

and:

```text
new information changes what should happen next
```

can both be true.

A roadmap does not have to rewrite history in order to change the future.

## AI makes bad foundations compound faster

When implementation is slow, there is a temptation to say:

> Let's finish deriving too, then clean everything up together.

At least the feature list moves forward.

With AI, that became more frightening.

The next layer can be implemented extremely quickly.

Then another layer.

Then tests and docs on top.

If the lower seam is already questionable, **the wrong premise compounds at machine speed**.

So stopping earlier becomes cheaper than cleaning up later.

The agent sitting idle for a moment is not the expensive outcome.

Beautiful code built on a premise I already know is wrong is.

## "Keep the agents busy" is not the objective

This was psychologically harder than I expected.

If I have an available Codex slot and #293 is already written, why not start it while #392 is being considered?

Because #293 depends on the behavior being repaired.

The right scheduling choice is:

```text
do not dispatch it yet
```

Agent utilization goes down.

Project coherence goes up.

That is a trade I am increasingly happy to make.

I wrote about becoming the human scheduler/load balancer separately because this exact behavior keeps repeating.

## A roadmap is not a promise to the past

I used to think of a roadmap as:

```text
the plan we decided earlier
```

and therefore something that should remain stable unless the project failed to follow it.

Now I think of #291 more like:

**the best execution order under the facts we currently know.**

New facts should change it.

A merged implementation reveals a new seam.

A dependency turns out to be stronger than expected.

A hotfix becomes necessary.

The graph moves.

If the roadmap never changes, I may simply be ignoring information.

## Post-merge review creates different bugs from implementation-time review

While an Issue is active, attention is naturally focused on its scope.

After merge, I can look at the resulting layer from farther away.

That is when I notice things such as:

```text
This individual feature works.
But do I trust this path as the foundation for the next three features?
```

That is a different review question.

The JSON core could be complete as a core milestone while still producing a new hotfix Issue once the integrated shape was inspected.

I increasingly expect this pattern rather than treating it as a process failure.

## The interruption was probably faster overall

A hotfix inserted into a roadmap looks like delay.

But compare the alternatives:

```text
find problem
↓
fix it while the context is fresh
↓
continue
```

versus:

```text
find problem
↓
keep building two more layers
↓
return later
↓
repair every dependent path too
```

The first route moves the next checkbox later.

It may finish the real system sooner.

**An interruption is not automatically a detour.**

## Faster implementation made sequencing more valuable

AI improved the speed of individual work items.

That means the question:

```text
What should we implement next?
```

has more leverage than before.

Wrong order still produces code quickly.

Right order lets the same speed compound in the useful direction.

https://github.com/KentaroMorishita/seseragi

The roadmap said JSON deriving was next.

Review found a reason to stop.

So I stopped it.

I have started thinking of that ability — **to interrupt a fast implementation pipeline when the premise becomes suspicious** — as part of development speed too.