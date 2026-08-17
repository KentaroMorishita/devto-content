---
title: "What Does seseragi build Actually Produce?"
published: false
tags: programming, compilers, webdev, seseragi
description: "The backend is TypeScript today, but the build artifact only makes sense after Seseragi has already decided what the program means."
series:
main_image:
canonical_url:
---

Once `seseragi new web` could create a project and `seseragi dev` could run the development loop, a very ordinary question became unavoidable:

**What does `seseragi build` actually produce?**

This is the kind of thing I occasionally have to re-explain to myself because Seseragi is simultaneously:

- its own language
- a Rust compiler
- a TypeScript backend
- a Web toolchain
- a runtime

The final directory looks much more boring than the middle of the pipeline.

I like that.

## Source does not turn directly into JavaScript text

The current compiler pipeline is roughly:

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

The Web target eventually lands in the TypeScript/JavaScript ecosystem.

But Seseragi is not implemented as:

```text
read source
replace some syntax
emit TypeScript
```

Name resolution happens first.

Type checking happens first.

ADT exhaustiveness, Effect contracts, trait evidence, and the rest of Seseragi semantics are established before backend-specific lowering.

Then the program is reduced through Core IR and finally through a TypeScript-specific IR.

That separation is why I keep saying:

**TypeScript is the backend, not the language.**

I wrote the longer version of that here:

https://dev.to/kentaromorishita/typescript-is-a-backend-not-the-language-db9

## Using TypeScript as a backend does not mean delegating semantics to TypeScript

This distinction matters a lot to me.

TypeScript is a very practical first backend for a language that wants to run on the Web.

It already has excellent toolchains, JavaScript interop, browsers, Bun/Node runtimes, source maps, and an enormous host ecosystem.

I want to use that.

What I do not want is:

```text
Seseragi's type system is whatever the TypeScript checker accepts after transpilation.
```

By the time TypeScript IR is produced, Seseragi has already decided what the program means.

The backend's job is to preserve that meaning in a form the host can execute.

This feels much closer to a traditional compiler pipeline than to adding one more syntax layer on top of TypeScript.

The IRs are Seseragi's way of keeping that boundary explicit.

## The Rust comparison is architectural, not a claim that Core IR is MIR

Rust does not lower surface syntax directly to LLVM text by string manipulation either.

Meaning is progressively made explicit through compiler representations before reaching a backend.

Seseragi's Core IR is obviously not Rust MIR, and the compiler is nowhere near Rust's scale.

The part I sympathize with is simpler:

**The source language should own a representation of its own semantics before backend-specific concerns take over.**

That is the lesson I cared about after the old TypeScript implementation became increasingly hard to refactor.

When parsing, typing, lowering, and emission remain too close together, the question "where is this semantic decision actually made?" starts producing uncomfortable answers.

## `build` is more than the compiler emitting a module

For a Web application, generated TypeScript alone is not the product.

The browser needs an entry point.

The runtime has to be connected.

The DOM host has to exist.

Modules have to become a browser-consumable graph.

Source maps matter.

The output should be deployable without asking the user to copy random files out of the compiler repository.

So the Web build surface is really:

```text
compile Seseragi source
+
connect the target runtime
+
produce a deployable Web artifact
```

That contract was implemented in:

https://github.com/KentaroMorishita/seseragi/issues/209

Issue #209 is completed now.

The important requirement is that one Web build command creates a directory that can be served as static files and actually run the application.

## The artifact is deliberately ordinary

The output contract is roughly:

```text
dist/
├─ index.html
├─ assets/
│  └─ app.js
├─ *.map
└─ .seseragi-build.json
```

After all the talk about HKT, Effect evidence, Core IR, browser adapters, and target diagnostics, the thing you deploy is a normal static directory.

That contrast is satisfying.

The compiler internals can be complicated.

The deployment contract should not require a compiler architecture lecture.

## Target-specific product output is different from source-language meaning

Seseragi is not intended to be Web-only.

That means the compiler cannot simply define:

```text
a program = something with index.html and a DOM mount point
```

Those are Web product requirements.

A process target has different entry/runtime/output requirements.

So the architecture naturally separates:

```text
Seseragi semantics
↓
Core IR
↓
target/backend lowering
↓
product artifact
```

This is where building a language and building a usable toolchain stop being the same job.

The compiler can understand a program while the product layer still has to decide how that program becomes something people can run or deploy.

## Go and TypeScript put the compiler/product boundary in very different places

Go has a wonderfully obvious story in many cases:

```sh
go build
```

produces a native executable.

The compiler and the product artifact feel tightly integrated.

TypeScript often has a different division of labor:

```text
tsc
+
bundler
+
framework build
+
asset pipeline
```

depending on the project.

Seseragi's Web toolchain leans toward giving the user a one-command product build while still keeping the internal compiler/backend/runtime boundaries explicit.

That is why `seseragi build` is not merely an alias for the TypeScript emitter.

## Core IR buys architectural freedom, not a free second backend

It is tempting to say:

> Because Seseragi has Core IR, we can target anything now.

That would be overselling it.

A WASM, native, or LLVM backend would still be a serious project.

Runtime capabilities have to be implemented.

Representations have to be designed.

Host services need contracts.

But Core IR does prevent the first backend from automatically becoming the language definition.

That is the important win.

The architecture leaves a place where another backend can begin without having to reverse-engineer Seseragi semantics from generated TypeScript.

## The `.map` files are part of the product story too

Generated code is only useful for development if errors and debugging can point back to the source programmers wrote.

Source maps therefore are not an incidental backend artifact.

They are part of the contract connecting Seseragi source to the host runtime.

The Web build issue requires deployable maps and explicitly rejects absolute paths that leak the repository or Playground source layout.

That sounds like tooling trivia until you try to debug a compiled language in a browser.

Then it becomes the difference between:

```text
something exploded in generated app.js:1827
```

and:

```text
the failure maps back to the Seseragi source you actually own
```

## Users ideally never need to know most of this

The intended flow is boring:

```sh
seseragi new web my-app
cd my-app
seseragi dev
seseragi build
```

That is enough.

A user should not need to understand Typed HIR before building a Web app.

They should not need to know TypeScript IR exists before deploying one.

I like the fact that the toolchain can have a deep internal pipeline while the product surface stays ordinary.

I wrote about that contrast separately here:

https://dev.to/kentaromorishita/inside-hkt-effect-core-ir-outside-seseragi-new-web

## The build pipeline is really an architecture statement

The final output being JavaScript does not make Seseragi a JavaScript syntax experiment.

The important order is:

```text
Seseragi decides the program's meaning
↓
Core IR preserves that language-owned meaning
↓
TypeScript backend lowers it for the host
↓
Web build packages the target-specific product
```

That is a lot of machinery behind a command as ordinary as:

```sh
seseragi build
```

But that is exactly what I want the command to hide.

The output should be boring.

The language semantics should not be.