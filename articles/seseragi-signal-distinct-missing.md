---
title: "Signal Had map, combine, switchMap... and Somehow No distinct"
published: false
tags: programming, reactive, state, seseragi
description: "The Signal runtime had most of the interesting pieces. Then I reread the spec and noticed one very ordinary operation was still missing."
series:
main_image:
canonical_url:
---

Signal in Seseragi had gotten surprisingly far.

`map` existed.

`combine` existed.

`constant` existed.

`switchMap` existed.

`subscribe` existed.

Then I looked back at the specification and noticed something extremely ordinary.

**Where is `distinct`?**

Not a deep missing abstraction.

Not a new runtime model.

Just the operation that suppresses repeated equal notifications.

It was specified.

It was not implemented.

## The contract is almost boring

Seseragi's specification defines:

```rust
fn distinct<A> source: Signal<A> -> Signal<A>
where Eq<A>
```

Suppose a source publishes:

```text
1 -> 1 -> 2 -> 2 -> 3
```

The distinct Signal should be observed as:

```text
1 -> 2 -> 3
```

The source still updates.

`distinct` creates a derived Signal that decides whether the new value should be forwarded to subscribers.

If the next value is equal to the last published value according to `Eq<A>`, suppress the notification.

If it differs, publish it.

That is exactly the kind of operation you assume a reactive system has until you try to use it and discover it doesn't.

## Reactive libraries have several reasonable answers here

RxJS has `distinctUntilChanged`.

That is probably the closest familiar shape:

```ts
source.pipe(distinctUntilChanged())
```

Some reactive primitives instead build equality suppression directly into the source itself. Setting the same value may simply produce no observable update.

Both designs are reasonable.

Seseragi deliberately chose the explicit derived-operation side.

The source remains a source of updates.

If I want an observer to ignore consecutive equal values, I derive:

```rust
signals.distinct source
```

The implementation issue explicitly keeps **automatic distinct-by-default** out of scope.

That choice says something small but important about the Signal model:

```text
source update
```

and:

```text
observer-visible change
```

are not forced to be the same concept.

## I do not want `set` to pretend the update never happened

This matters with `MutableSignal`.

Seseragi can update a source through:

```rust
signals.set 42 state
```

or the operator surface:

```rust
state := 42
```

I wrote about why `:=` is an update to a Signal source rather than general variable assignment here:

https://dev.to/kentaromorishita/i-didnt-want-assignment-i-wanted-to-change-a-signals-current-value

`distinct` lives on the observation side of that story.

The source can receive another `42`.

A derived distinct Signal may decide that subscribers do not need another `42` notification.

That separation feels cleaner than quietly baking one universal equality policy into every source update.

## The nice part is that equality already exists

A library API could ask for a comparator every time:

```ts
distinctUntilChanged((left, right) => ...)
```

That is flexible and often useful.

Seseragi already has a language-wide equality capability:

```text
Eq<A>
```

So the standard operation can simply require:

```rust
where Eq<A>
```

A domain type can provide its own Eq instance.

Primitive and structural values can use their normal language equality rules where those instances exist.

I do not need a second Signal-only definition of what "same value" means.

This is exactly the kind of small reuse that makes a type-class system feel practical rather than ornamental.

## Of course, the current Eq implementation found a way to make this interesting too

There is a current compiler gap around standard Prelude evidence.

A user-defined Eq instance can flow through generic `where Eq<A>` code, while some standard equality behavior can still work through dedicated operator paths without being available as the same first-class generic evidence.

That issue is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/394

As of this draft, #394 is still open.

That matters for `distinct` because its signature does not merely say:

```text
some equality operation exists somewhere
```

It says:

```text
resolve Eq<A> through the normal trait evidence system
```

So implementing `signals.distinct` is also another place where the standard/user-defined instance split has to become genuinely unified.

Separate issues suddenly touch the same semantic boundary.

That is what the Seseragi roadmap increasingly looks like: not a list, but a graph.

## A naïve implementation sounds easy

You could imagine:

```text
remember previous value
when next value arrives:
  compare
  if equal, skip callback
  otherwise publish and replace previous value
```

And conceptually, yes, that is the operation.

But Seseragi's Signal runtime also has transactions and glitch-free graph semantics.

That means an implementation cannot only think in terms of one callback firing after another.

A derived node may recompute multiple times inside a transaction.

Other Signals may be combined.

Dependencies may flow through `switchMap`.

Subscribers should not observe temporary intermediate states that the transaction model says are invisible.

So `distinct` has to participate in the same runtime graph semantics as every other derived Signal.

## One ordinary helper reaches all the way down into the runtime

The current implementation gap is tracked in:

https://github.com/KentaroMorishita/seseragi/issues/314

As of this draft, #314 is still open.

The issue covers:

- public `std/signal` interface
- `Eq<A>` evidence resolution
- runtime derived-node behavior
- transaction recomputation and notification
- composition with `combine` and `switchMap`
- lowering
- Reference and Analysis surfaces
- Playground execution tests

From user code, the desired API is one line:

```rust
signals.distinct source
```

From the implementation side, that line crosses the compiler, type-class evidence, runtime graph, transaction rules, and tooling.

This keeps happening to me.

The smaller the API looks, the more offensive the implementation checklist feels.

## This is where using RxJS feels wonderfully unfair

In TypeScript, I can install or import a reactive library and write:

```ts
source.pipe(distinctUntilChanged())
```

Done.

As a library user, I get to treat the operation as obvious.

I do not need to decide:

```text
Does equality happen before or after transaction commit?
What counts as the previous published value?
How does this interact with a dynamic dependency switch?
Does a repeated set mutate source state even if no notification escapes?
```

Someone else already made those choices.

Building the language/runtime moves me to the other side of that abstraction boundary.

Now even the boring operators need a semantic contract.

It changes how you look at every "tiny convenience" in an existing library.

## The missing operation was discovered by reading the specification, not by inventing a new idea

That is probably the funniest part.

The sequence was:

```text
Signal feels pretty complete
↓
look at the specification
↓
map: yes
combine: yes
constant: yes
switchMap: yes
subscribe: yes
↓
...where is distinct?
```

The design work had already happened.

The runtime had most of the surrounding infrastructure.

The public surface simply never got connected.

This is the same category of bug as an Array having safe `get` semantics while `array[index]` is still missing: everything around the hole makes the hole more irritating.

## This article is intentionally being written before the feature works

Right now, this is **not** a Playground-ready example:

```rust
signals.distinct source
```

Issue #314 is still open.

The Signal Tour is here for the parts that are implemented today:

https://seseragi.vercel.app/tour/

Once #314 is finished, the documentation will probably reduce the whole story to something like:

```rust
signals.distinct source
```

Suppress consecutive equal publications using `Eq<A>`.

Perfectly good reference documentation.

But I want to keep the more interesting moment too:

> The reactive runtime had `map`, `combine`, `switchMap`, and transactions.
>
> Then I reread the spec and realized I had somehow forgotten `distinct`.

That is much closer to what building the language actually feels like.