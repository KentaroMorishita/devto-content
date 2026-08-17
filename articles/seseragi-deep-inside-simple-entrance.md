---
title: "Inside: HKT, Effect, Core IR. Outside: seseragi new web"
published: false
tags: programming, webdev, compilers, seseragi
description: "The compiler kept getting deeper. The Web entry point got simpler. I think that contrast says a lot about where complexity belongs."
series:
main_image:
canonical_url:
---

If I describe Seseragi from the inside, it has started to sound a little dangerous.

Higher-kinded types.

Traits and instances.

Functor, Applicative, Monad.

Effect.

Signal.

Typed HIR and Core IR.

Provider boundaries.

A TypeScript backend behind a language-defined intermediate representation.

Then the Web entry point became:

```sh
seseragi new web my-app
cd my-app
seseragi dev
```

**The inside got weird. The entrance got ordinary.**

I really like that contrast.

## I do not want users to understand the compiler before they can build something

Seseragi having HKT does not mean the Getting Started page should begin with kinds.

Effect having environment/error/result types does not mean someone should learn environment merging before rendering Hello World.

If the immediate goal is "make a small Web app," the first loop should be boring:

```text
create project
↓
run dev server
↓
edit file
↓
reload browser
↓
build
```

The deeper language concepts should appear when the problem needs them.

A sophisticated implementation is not an excuse for a sophisticated onboarding ceremony.

## Go and modern Web tooling are good reminders of this

Go contains a compiler, runtime, garbage collector, scheduler, and plenty of implementation depth.

The front door is still something like:

```sh
go mod init
go run .
go build
```

Rust has MIR, borrow checking, monomorphization, and an enormous compiler architecture.

`cargo new` does not ask you to learn any of that first.

Modern TypeScript/Web tooling is similar.

A Vite or framework scaffold can create a project and start a browser dev loop without explaining bundler graphs, module transforms, source maps, or HMR internals up front.

That seems obvious as a user.

It becomes surprisingly easy to forget when the internals are the part you are personally excited about building.

When you have just implemented HKT, you really want to tell everyone you implemented HKT.

Someone who wants a Web page may reasonably not care yet.

## The deep machinery is supposed to make the surface calmer

This is the relationship I keep aiming for.

I want HTTP to look like an Effect operation.

Underneath, there may be providers, cancellation, host adapters, and runtime services.

I want multiple Signal values to combine into a view.

Underneath, there are transactions, subscriptions, and graph semantics.

I want the same `map` abstraction to work through generic capabilities.

Underneath, there are higher-kinded parameters, trait evidence, and module-interface metadata.

The abstractions did not grow because I wanted application code to look more academic.

They grew because **making the source model ordinary often requires somewhere else to absorb the complexity**.

## This is a different answer from "keep the internals simple too"

I sympathize with languages such as Go that often reduce complexity by refusing entire abstraction categories.

Seseragi did not take that route.

Its internals genuinely became more complex.

There is HKT.

There is an effect system.

There is a reactive runtime.

There are multiple compiler representations.

So the strategy is not:

```text
remove complexity everywhere
```

It is more like:

```text
accept necessary complexity
put it in the layer that owns it
avoid making every user step through it
```

That is a different kind of simplicity.

## `seseragi new web` was really a decision about where complexity should live

The Web scaffold work was tracked here:

https://github.com/KentaroMorishita/seseragi/issues/368

That issue is completed now.

The goal was intentionally practical:

> From a clean directory, create a canonical Web package in one operation and reach `dev` without manually assembling the manifest/package layout.

The generated project is deliberately ordinary:

```text
my-app/
  seseragi.toml
  src/
    main.ssrg
```

No special scaffold-only project format.

No hidden package-manager step.

No experimental syntax inserted just to make the starter look impressive.

That last part matters.

A convenient entry point should not require a second project model that exists only for convenience.

The scaffold should create the same kind of project the rest of the toolchain understands.

## A generator is easy to make convenient by creating future debt

Imagine `seseragi new web` produced a magic project layout that only the generator understood.

Then later:

- CLI has one project model
- Playground has another
- LSP expects another
- examples have their own conventions
- scaffold templates duplicate canonical samples

The first five minutes would be easy.

The next two years would be weird.

So #368 explicitly requires the generated project to reuse the canonical project contract shared by CLI/LSP/other tooling.

**Easy onboarding and special-case architecture are not the same thing.**

That is exactly the kind of distinction I want the toolchain to protect.

## `seseragi dev` also stays in the toolchain layer

The dev-loop work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/365

That issue is completed too.

The first version does the straightforward things:

```text
build Web target
serve static files
watch source/manifest changes
rebuild
reload browser
keep server alive across compile errors
serve source maps
clean up on shutdown
```

No HMR requirement.

No SSR requirement.

No router.

And importantly, the implementation is toolchain-host functionality in the Rust CLI.

It is not required to self-host the dev server through Seseragi's application-level `std/http/server` API.

That separation is one of my favorite details.

## "Seseragi can do it" does not mean "Seseragi source should do it"

Once a language has an HTTP server API, there is a seductive bootstrap story:

> Wouldn't it be cool if the Seseragi dev server were written in Seseragi?

Yes, it would be cool.

That is not automatically the right architecture.

A development server has toolchain responsibilities:

- watching source files
- rebuilding projects
- maintaining dev-only reload transport
- reporting compiler diagnostics
- managing generated output
- shutting down resources with the CLI process

Those concerns belong naturally to the development tool host.

An application HTTP server has a different contract.

I would rather keep the layer boundary honest than self-host something merely because the language can technically express it.

## The first dev server intentionally does less than a modern framework dev server

If you are used to Vite, Next.js, Nuxt, or similar tooling, full browser reload sounds almost primitive.

That is fine.

The first goal was:

```text
edit Seseragi source
↓
compiler rebuilds
↓
browser reflects the change
```

HMR can come later if its complexity earns its place.

Keeping Signal state alive across module replacement, patching runtime graphs, deciding invalidation boundaries — those are real semantic/tooling problems.

There is no need to pretend they are free because modern Web developers expect a fancy dev server.

A simple loop that is correct is a better entry point than a magical loop built on unstable semantics.

## The language started feeling more real when the entry point became boring

This surprised me.

Getting ADTs or Monad working in the compiler was exciting.

But there is another kind of reality that appears when this works:

```sh
seseragi new web my-app
cd my-app
seseragi dev
```

A directory appears.

A browser opens.

You edit source.

It rebuilds.

Suddenly the project feels less like:

```text
an experimental compiler with impressive samples
```

and more like:

```text
a tool you can start a project with
```

The internal sophistication did not create that feeling.

The ordinary entrance did.

## I did not want to solve Web development by putting a framework-shaped language on top

Project scaffolding, components, state, DOM runtime, and dev servers usually live in framework/tooling territory in the TypeScript ecosystem.

Seseragi pulls some of that closer to the standard language/toolchain surface.

But I still do not want the application to suddenly switch into a separate framework DSL.

The pieces remain:

```text
functions
ADT
Effect
Signal
Html values
```

and the runtime/toolchain connects them into a usable product.

That is the slightly greedy goal:

**I want framework-level ergonomics without requiring a second programming model on top of the language.**

Whether Seseragi fully succeeds at that is another question.

It is definitely the direction.

## This is also how I want the article graph to work

There are articles about HKT.

There are articles about Core IR.

There are articles about Signal transactions, compiler gaps, and AI orchestration.

I do not want a reader to consume all of them before the Web story makes sense.

The entry article should still be readable from the surface.

If someone gets curious, they can follow links downward into the weird machinery.

That mirrors the language itself:

```text
simple entrance
↓
optional depth
↓
very strange basement
```

I think that is a good shape for both software and writing.

## Complexity is not disappearing. I am choosing its address

Web I/O, generic abstraction, reactive graphs, compilers, and tooling are not simple problems.

Pretending the complexity has vanished usually means it moved somewhere undocumented.

The design question I keep coming back to is:

> Which layer should be responsible for this complexity?

HKT can stay in the type system.

Host cancellation can stay under Effect boundaries.

Signal transaction machinery can stay in the runtime.

Source watching and browser reload can stay in the CLI.

The user's first interaction can stay:

```sh
seseragi new web my-app
seseragi dev
```

Internal depth and an ordinary entrance are not opposites.

Sometimes the first is exactly what makes the second possible.

That contrast may be one of the clearest descriptions of Seseragi I have right now:

**Inside: HKT, Effect, Core IR. Outside: create a project and run it.**