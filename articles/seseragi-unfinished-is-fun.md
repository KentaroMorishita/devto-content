---
title: "Seseragi Isn't Finished. That's Why I Keep Finding Things to Write About."
published: false
tags: programming, opensource, languages, seseragi
description: "Finished reference docs get shorter. The interesting stories live in the gap where the spec, compiler, runtime, Playground, and my expectations still disagree."
series:
main_image:
canonical_url:
---

Seseragi is not finished.

It is experimental and pre-release.

Some things exist in the specification but not in the current compiler.

Some semantics exist in the runtime while one syntax surface is missing.

Sometimes I open the Playground, write completely normal code, and hit a bug.

At first I thought:

> Maybe I should wait until the language is more complete before writing articles about it.

Lately I feel almost the opposite.

**The unfinished state is where most of the stories are.**

## Once a feature is finished, the explanation can become one sentence

Take List cons.

A finished reference entry can say:

```rust
head : tail
```

> `:` prepends an element to a List and associates to the right.

Good documentation.

The development story was more like:

```text
build List
↓
build List literal
↓
build List patterns
↓
add Monad instance
↓
wait, where is cons?
↓
open Issue
↓
prototype :: with custom operators
↓
it works
```

That version is much more fun.

I built a persistent List and somehow forgot the most List-shaped operation of all.

After the final `:` is implemented, the weird order disappears from the product.

I want to keep the order somewhere.

## Array indexing was another perfect unfinished-language bug

The specification says:

```rust
values[1]
```

returns:

```text
Maybe<A>
```

because index access is safe by default.

Then I tried it in the Playground.

It did not work.

But `std/array.get` worked.

The runtime semantics existed.

The specification existed.

The Tour even mentioned Array access.

**Only the square-bracket surface was missing.**

Almost everything was there except the last five centimeters of wire.

Once the feature is completed, users will simply write:

```rust
values[1]
```

and never know how irritating that gap was.

That is exactly why I wrote it down.

## `??` currently has a reserved seat and no person sitting in it

Maybe fallback is specified as:

```rust
cached ?? fallback
```

The symbol is reserved.

Userland cannot define another custom `??`.

And the built-in implementation is still waiting.

So the language has effectively reserved the seat before the guest arrived.

After implementation, `??` should become boring.

That is success.

Right now the unfinished mismatch is funny enough to expose another part of the compiler design: a short-circuit operator cannot simply be modeled as an ordinary eager custom function.

The hole teaches the reason for the boundary.

## Spec, compiler, runtime, tooling, and product do not finish at the same moment

A homemade language regularly lives in states such as:

```text
specified, not implemented
implemented, not exposed
CLI works, Playground doesn't
runtime works, parser doesn't
Tour sample is stale
old TypeScript version had it, Rust rewrite doesn't yet
```

At first I thought of these as embarrassing synchronization failures.

Some of them are bugs, obviously.

But when I investigate why the mismatch exists, I often find the interesting design story underneath.

The finished feature tells me **what** Seseragi does.

The mismatch often tells me **why the architecture ended up this way**.

Those are different kinds of documentation.

## The Rust rewrite makes the gaps even stranger

Seseragi was implemented once in TypeScript and then rewritten in Rust.

So a feature can have this history:

```text
old implementation had it
current specification still has it
Rust implementation has not reconnected it yet
```

And sometimes the semantics changed during the rewrite.

Array indexing is a good example.

An older design could return the element directly.

The current design returns `Maybe<A>`.

So "restore the old feature" is not the real task.

The surface name survived while the meaning evolved.

If you only read the final reference manual later, that transition will be invisible.

## Bugs make me read my own specification more carefully

This is one of the funniest consequences.

I try something.

It fails.

Then I finally read the exact specification section with much more attention than I did while writing it.

Array index fails.

I check:

```text
Array index -> Maybe<A>
List index  -> intentionally absent
std/array.get -> same safe semantics
```

And suddenly I notice:

> Ah. The Array/List distinction is visible here too.

The bug sent me looking for one missing surface and I came back understanding the type design better.

**Broken behavior can reveal design intent that a happy-path demo never forced me to notice.**

## AI turns the discovery into an Issue very quickly

Seseragi uses AI agents heavily for implementation.

So the loop can be fast:

```text
something feels wrong in Playground
↓
investigate
↓
compare spec and implementation
↓
write Issue
↓
put it in the execution graph
↓
Codex implements it
```

The Issue already contains much of what later becomes article material:

```text
why the behavior matters
what semantics already exist
what must not become a special case
non-goals
completion criteria
```

Development log and article source started moving closer together almost by accident.

I wrote about the Issue graph here because, yes, the one-person hobby project somehow acquired an execution control plane too.

## The Playground turned into an article generator

The loop is embarrassingly consistent:

```text
write ordinary Seseragi
↓
it works
↓
change something small
↓
it doesn't
↓
get annoyed
↓
read spec
↓
find a missing connection
↓
Issue
↓
article
```

What am I doing?

But it is healthy dogfooding.

A specification checklist can tell me a feature exists.

Actually using the language reveals whether the feature is reachable, understandable, composable, and pleasant.

The Playground stopped being only a demo long ago.

It became the place where I use the language enough to find its seams.

## An unfinished article can be updated later

Some of these articles explicitly say:

> This feature is specified but not implemented on current main yet.

I link the Issue.

When it closes, the article can gain a note:

> Update: this now works.

That does not make the earlier article wrong.

It records a point in the language's development history.

Reference documentation should tell users the current truth.

These articles are trying to preserve the route that produced that truth.

Those jobs should not be confused.

## The unfinished state also creates experiments I would never run later

List cons is missing.

But custom operators already exist.

So I try:

```rust
::
```

as a userland cons-like prototype.

It works.

Now I have learned something interesting about composability:

```text
List
+
right-associative custom operator
+
ordinary functions
```

were already sufficient to prototype the missing surface from inside the language.

If the canonical `:` implementation had existed from day one, I probably never would have tried that experiment.

Some accidental creativity only happens because the product is incomplete.

## Finished language docs should be cleaner than these articles

Eventually the reference should look like:

```text
this syntax exists
this type has this contract
this function does this
```

Clear. Current. Boring in the good way.

That is not what I am trying to preserve here.

I want to remember:

```text
I wanted this
↓
I tried it
↓
it was missing
↓
why?
↓
the reason touched this architecture/design choice
```

https://github.com/KentaroMorishita/seseragi

Seseragi is unfinished.

So there are bugs, missing surfaces, stale assumptions, and pieces of the specification waiting for implementation.

And every time I hit one now, part of me gets annoyed.

Another part immediately thinks:

**Well. There's another article.**

Once the language is finished, I suspect this category of story gets much harder to find.

So I should probably write them now.