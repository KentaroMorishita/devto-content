---
title: "I Built a Programming Language, and Somehow It Has `seseragi new web` Now"
published: false
tags: programming, webdev, tooling, seseragi
description: "The language could render HTML, run Signal, build for Web, and even serve locally. The missing piece was embarrassingly ordinary: how does someone create the first project?"
series:
main_image:
canonical_url:
---

At the beginning, Seseragi development was exactly what you would expect from a homemade programming language.

Write source.

Feed it to the compiler.

Celebrate when anything comes out.

Hello World worked.

`match` worked.

Maybe worked.

Then HTML became an ordinary value, the DOM runtime became interactive, Signal appeared, Web builds appeared, and a local dev server appeared.

Then somehow this command showed up:

```sh
seseragi new web my-app
```

**My programming language suddenly started acting like a Web framework.**

## Having Web features did not mean anyone could start a Web project

The pieces were already surprisingly complete.

Seseragi could:

- build HTML values
- hold reactive state with Signal
- connect to the DOM runtime
- build a Web target
- run a local `seseragi dev` loop

I wrote about that dev loop here:

https://dev.to/kentaromorishita/my-homemade-language-has-a-normal-dev-server-now

But a new user still had another problem:

**How do I create the first project?**

Write the manifest manually?

Create the directory structure?

Find the correct entry point?

Copy a sample from the repository?

That is a pretty cold entrance for someone who just wants to try the language.

So this became an Issue:

https://github.com/KentaroMorishita/seseragi/issues/368

The goal was intentionally small:

**You should not need to study the repository layout before you can reach a running Web app.**

## `cargo new` and `create-vite` suddenly looked less trivial

I have used project generators for years without thinking much about them.

Rust:

```sh
cargo new my-app
```

Vite:

```sh
npm create vite@latest
```

Go:

```sh
go mod init example.com/my-app
```

They do more than create a few files.

They tell the user:

> In this ecosystem, this is a normal place to begin.

That canonical entrance matters.

A compiler can be capable while the product still feels unfinished if the first step is a README full of manual setup.

I only really noticed that after becoming responsible for the whole path myself.

## The current entrance is boring, which is exactly what I wanted

Now the flow is:

```sh
seseragi new web my-app
cd my-app
seseragi dev --open
```

The generated project is intentionally small:

```text
my-app/
  seseragi.toml
  src/
    app.ssrg
    main.ssrg
```

The part I like most is not the number of files.

It is that the scaffold does **not** invent a special project format used only by the generator.

The CLI uses the canonical Web starter package as the source for the generated project.

So I do not have:

```text
one correct project for examples
another correct project for scaffolding
```

The same starter can support examples, manual checks, and `new web`.

**Making the entrance easier did not require creating another source of truth underneath it.**

## A project generator can accidentally become a framework layer

Once you add `new web`, the temptation to keep going is immediate.

Choose a CSS framework?

Add a router?

Select a testing stack?

Generate backend code too?

Ask which package manager to use?

Turn the whole thing into a wizard?

Modern TypeScript generators are powerful precisely because they can assemble a full stack.

That is useful.

It was not what I wanted from the first Seseragi scaffold.

The initial requirement was only:

```text
create a normal Seseragi project
↓
run it with the normal Seseragi dev command
```

So #368 deliberately avoided turning the generator into another framework surface.

**Keep the entrance thin. Add choices when real applications require them.**

That instinct feels closer to Cargo or Go tooling than to a giant framework questionnaire.

## I also did not want `new web` to mean "first understand the JavaScript toolchain"

There is another common association with Web scaffolding:

```text
create project
↓
npm install
↓
large dependency tree appears
↓
now understand the host toolchain
```

Seseragi's Web target does use TypeScript/JavaScript underneath.

Browsers obviously run JavaScript.

That is the backend/runtime layer.

I do not want it to become the first concept a Seseragi user has to manage manually.

The desired front door is simply:

```text
Seseragi project
↓
Seseragi source
↓
seseragi dev
```

The implementation is allowed to be much stranger underneath.

The user does not need to inherit every backend concern at the entrance.

## A generator is not language syntax, but it can be the first thing users judge

`seseragi new web` does not change the parser.

It does not add another type-system feature.

No HKT becomes more powerful because the command exists.

And yet it may be one of the first things someone touches.

```sh
seseragi new web my-app
```

creates the project.

```sh
seseragi dev --open
```

opens the browser.

Only then do they see the language source.

That means a piece of "peripheral tooling" can become the actual front face of the language.

Before building Seseragi, I thought much more in terms of:

```text
compiler = language core
CLI = surrounding tools
```

From a user's perspective, that ranking is often meaningless.

The experience is the whole path.

## Writing the generator exposed ambiguity in the project model

Manual setup lets a human compensate for unclear rules.

You can look around the repository and figure out:

```text
Which file is the entry point?
Which manifest fields are actually required?
Which files are optional?
What is the canonical Web target shape?
```

A generator cannot rely on human intuition.

It has to produce **one answer**.

So building `new web` also became a project-format review.

The tool forced the existing contract to answer:

- minimum files
- canonical manifest
- entry point
- target defaults
- reusable starter package

This happens repeatedly while building Seseragi.

A small surface feature reaches downward and exposes places where the underlying contract was still fuzzy.

## `new web` plus `dev` changed the feeling more than I expected

A scaffold alone is just a directory generator.

But this works immediately afterward:

```sh
cd my-app
seseragi dev --open
```

Now I am not opening a sample embedded in the compiler repository.

I created a normal project.

I can edit it with my normal editor.

The browser updates.

Underneath, the Rust compiler runs, Core IR appears, the TypeScript backend lowers it, and the Web runtime connects everything.

But none of that has to be understood before the first edit.

**The internals became unusual while the entrance became ordinary.**

That contrast still makes my brain glitch a little.

## There was no grand CLI product plan at the beginning

I did not start Seseragi with a roadmap saying:

```text
Phase N: project scaffold
Phase N+1: local Web dev loop
```

The sequence was much more mundane:

```text
language works
↓
Playground works
↓
Web app works
↓
I want to write it locally
↓
dev server appears
↓
creating the first project is annoying
↓
new web appears
```

Most of the product surface grew because I tried to use the language normally and found another place where the experience was not normal yet.

https://github.com/KentaroMorishita/seseragi

That pattern is becoming one of my favorite parts of the project.

The interesting question is often not:

> What fancy language feature should I add next?

It is:

> I tried to use the thing like a normal tool. Why is this step still weird?

This time the answer became:

```sh
seseragi new web
```

I started by trying to make a programming language compile.

Somehow I ended up with a project generator.