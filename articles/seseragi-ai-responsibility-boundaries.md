---
title: "Good Boundaries Mean AI Can Be Wrong Without Breaking Everything"
published: false
tags: ai, architecture, compilers, seseragi
description: "The best protection I found for AI coding wasn't a clever prompt. It was making responsibilities explicit enough that mistakes stay local."
series:
main_image:
canonical_url:
---

I use AI heavily while building Seseragi.

The most useful protection I have found is probably not a prompt trick.

It is much older than that:

**separate responsibilities clearly.**

I cannot make an AI agent stop making mistakes forever.

I can make the codebase less likely to let one mistaken implementation redefine everything around it.

## The compiler is deliberately not one giant source-to-output transformation

The current pipeline is roughly:

```text
SourceSnapshot
-> TokenStream
-> LosslessCst
-> SurfaceAst
-> ModuleInterface + ResolvedAst
-> TypedHir
-> CoreIr
-> TypeScriptIr
-> TypeScript
```

When I first moved toward this architecture, part of me thought:

> Do I really need this many layers?

The old TypeScript implementation had shorter distances between source and emitted code.

That was faster at first.

It was also increasingly hard to answer:

```text
Where is this meaning decided?
Where did this type information disappear?
Why is a TypeScript convenience changing source semantics?
```

The Rust rewrite added more boundaries, not fewer.

With AI doing more implementation work, those boundaries turned out to be extremely practical.

## A boundary gives me a place to say "this is not your job"

If a source form parses incorrectly, look at the syntax side.

If types are wrong, inspect Typed HIR and evidence.

If Core meaning is correct but generated TypeScript is strange, fix backend lowering.

If an HTTP host adapter needs different cancellation machinery, do not redesign the public HTTP API merely to make the adapter easier.

This gives review a stronger sentence than:

> I don't like this code.

I can say:

> This information does not belong in this layer.

That is much harder to argue with accidentally.

## Architecture also becomes work decomposition

This matters when several agents or work items can move independently.

An Issue can say:

```text
Surface semantics are already fixed.
Do not change Core IR meaning.
Only repair TypeScript lowering.
Reuse the canonical registry.
```

Or a vertical compiler feature can enumerate what each stage needs to gain.

The code architecture and the work breakdown stop being separate documents.

**The same boundaries that help humans understand the compiler also define chunks I can safely hand to AI.**

That has been one of the biggest practical wins of the rewrite.

## HKT found a real boundary bug

Higher-kinded parameters such as:

```text
F<_>
```

carry more information than a name.

The compiler needs to preserve kind/arity information.

A local example can parse and type-check correctly while the meaning still breaks when exported through a module interface.

Seseragi had exactly this kind of regression:

https://github.com/KentaroMorishita/seseragi/issues/196

The important debugging question was not:

> Why doesn't this HKT example work?

It was:

> At which representation boundary did the metadata disappear?

Having distinct Typed HIR, interface, Core, and backend layers makes that question inspectable.

More layers created more contracts to maintain.

They also created places where the contract can be tested.

## Runtime boundaries work the same way

HTTP has a similar shape:

```text
std/http application surface
↓
HttpClient capability
↓
Provider contract
↓
browser / Bun / Node adapter
```

The browser adapter can use `fetch` and AbortController.

The application does not need to know.

If an agent changes the browser adapter, it should not need to redesign HTTP semantics.

If the public HTTP contract changes, that should be an intentional language/library decision rather than a side effect of host API convenience.

**A smaller responsibility produces a smaller blast radius.**

The same idea appears in compiler and runtime architecture.

## The dev server is a nice example of similar technology with different responsibility

`seseragi dev` runs an HTTP server.

Seseragi also has an application-facing HTTP server roadmap.

Those sound similar enough that self-hosting the dev server through `std/http/server` is tempting.

I deliberately did not make that a requirement.

The dev server belongs to toolchain host tooling:

- watch sources
- run compiler/builds
- keep diagnostics alive
- manage reload transport
- shut down with the CLI

An application HTTP server has a different public/runtime contract.

The fact that both listen on a port does not make them the same responsibility.

This is the sort of distinction an AI agent may not infer from a short prompt like "reuse the existing HTTP server."

Architecture gives me a reason to say no.

## Sources of truth matter even more when code generation gets cheap

AI agents are very good at creating one more useful helper table.

That can be exactly the wrong thing.

Seseragi has several domains where duplicated semantic registries become dangerous:

- standard traits and instances
- operator identities
- module surfaces
- formatter/parser grammar facts
- diagnostics

One real example is the standard `Eq<Int>` evidence gap:

https://github.com/KentaroMorishita/seseragi/issues/394

Integer equality could work through an operator-specific route while generic code requiring `where Eq<A>` failed to see the same standard instance.

The local routes both worked.

The language meaning was split.

That is the real failure.

**A source of truth is not just code organization. It prevents one semantic fact from becoming several almost-identical facts.**

## "AI went wild" usually means local optimization, not chaos

I do not mean an agent starts randomly deleting the repository.

The more common failure is extremely reasonable:

```text
finish this Issue quickly
↓
add a feature-specific helper
↓
create a local registry
↓
add a parallel route
↓
tests pass
```

Every step is defensible within the task.

The codebase as a whole becomes less coherent.

That is why a good Issue often needs architectural constraints, not only behavioral acceptance criteria.

## Boundaries make non-goals enforceable

Suppose an HTTP Issue is explicitly about HTTP transport.

Then I can say:

```text
JSON policy does not belong here.
Retry policy does not belong here.
Do not add a second Provider engine.
Do not leak host objects.
```

Those are not arbitrary limitations.

They follow from responsibility boundaries that already exist in the codebase.

Without architecture, "non-goal" can sound like personal taste.

With architecture, it becomes:

> That meaning belongs somewhere else.

## This is not architecture only for AI

A human-only codebase benefits from exactly the same thing.

The difference is speed.

When implementation accelerates, ambiguous responsibility can accumulate code much faster.

Clear responsibility accumulates useful code faster too.

AI amplified both outcomes.

That is why the architectural payoff became much more visible to me after using agents extensively.

## I want to delegate more, not less

The conclusion is not:

> AI is dangerous, so keep every important task manual.

I want to delegate a lot.

The more confidently the codebase says:

```text
this layer owns this meaning
this registry is canonical
this boundary translates host behavior
```

the more I can let an agent operate inside those contracts without reviewing the entire repository every time.

That is the point.

**Responsibility boundaries are not walls built because I distrust AI. They are the structure that lets me trust delegation at larger scale.**

https://github.com/KentaroMorishita/seseragi

If an agent gets one implementation wrong, I want the mistake to be local and inspectable.

A well-separated architecture cannot guarantee that.

It can make it much more likely.