---
title: "My Homemade Language Has a Normal Dev Server Now"
published: false
tags: programming, webdev, tooling, seseragi
description: "I wanted the boring loop I take for granted with Vite: edit, rebuild, reload, break something, fix it, keep going. Building it made Web tooling feel less boring."
series:
main_image:
canonical_url:
---

When Seseragi first rendered an interactive Web app in the Playground, I was extremely happy.

Then the next desire was completely ordinary:

**I want to edit locally. Save the file. Rebuild. Refresh the browser.**

Somehow a programming-language project had become a dev-server project.

The prerequisite was already there: `seseragi build` had a defined Web product artifact.

The next step was making that artifact pleasant to work with repeatedly.

## I did not want a special IDE

The loop I wanted was boring:

```text
write source
↓
build
↓
look in browser
↓
edit
↓
reload
```

Doing every step manually would make the language feel like a compiler demo rather than something I could actually use to build an application.

So the CLI got:

```sh
seseragi dev
```

and, if I want it to open the browser too:

```sh
seseragi dev --open
```

The implementation work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/365

Issue #365 is completed now.

## This is just what Vite already does for me every day

As a Web developer, none of this experience is novel.

TypeScript with Vite trained me to treat save-and-refresh as background noise.

That is why I originally thought of a dev server as "tooling convenience," far away from the interesting language work.

Then I had to build the path myself:

```text
load project
run compiler
manage output
watch files
serve HTTP
notify browser
recover from compile failures
```

All the invisible work became visible at once.

**It took building a language to make me appreciate how much labor is hidden inside "normal Web development."**

I did not expect one of the outcomes of Seseragi to be renewed respect for Vite.

## The command is short because the host tooling is doing a lot

The current dev loop is roughly:

```text
project load
-> Web build
-> static serve
-> watch sources/manifests
-> rebuild
-> full browser reload
```

The first version is intentionally not HMR.

A successful rebuild triggers a full reload.

That sounds primitive next to modern framework tooling.

It is also exactly enough to change the feeling of using the language.

The goal was not:

> Build the most advanced JavaScript dev server from scratch.

It was:

> Make Seseragi source feel like normal Web source while I am editing it.

Full reload accomplishes that already.

## Compile errors should not kill the whole development session

This was a small requirement that mattered a lot to me.

I am building a language.

Of course I am going to produce syntax errors and type errors constantly.

If every bad edit also kills the server process, the loop becomes:

```text
make mistake
↓
server dies
↓
fix mistake
↓
restart command
```

That is miserable.

So `seseragi dev` stays alive through compilation failures.

The compiler reports the diagnostics.

I fix the source.

The next successful build restores the browser loop without restarting the dev server.

```text
break it
↓
see compiler error
↓
fix it
↓
keep going
```

That tiny behavior is where compiler quality and product experience suddenly meet.

A compiler only needs to tell me the code is invalid.

A development environment needs to let me **continue living with invalid code while I am editing it**.

## The dev HTTP server is not the application HTTP server

This was an architectural boundary I wanted to keep very clear.

`seseragi dev` obviously needs an HTTP server to serve the built files and reload transport.

Seseragi also has separate work for an application-facing `std/http/server`.

It would be tempting to say:

> The language can have an HTTP server, so let's self-host the dev server with it.

That would create a strange dependency:

```text
want local Web development
↓
must first finish application HTTP-server semantics
```

Those are different responsibilities.

The dev server belongs to the toolchain host.

So the current implementation lives in the Rust CLI and does not require `std/http/server` self-hosting.

This is one of those recurring Seseragi distinctions:

**Two things can both use HTTP without belonging to the same layer.**

## Self-hosting is cool. It is not automatically good architecture.

Once your language becomes capable enough, "write the tooling in the language itself" becomes a very attractive milestone.

And yes, that would be fun.

But capability and responsibility are separate questions.

The dev server needs to:

- watch project files
- invoke compiler/build logic
- keep diagnostics alive
- manage dev-only output
- coordinate browser reload
- clean up with the CLI process

Those are toolchain concerns.

I would rather keep the layer boundary honest than force self-hosting because it sounds impressive.

## `seseragi new web` makes the whole thing feel much more real

`dev` becomes much nicer when paired with the scaffold command:

```sh
seseragi new web my-app
cd my-app
seseragi dev
```

Now someone does not need to know anything about HKT, Core IR, Effect providers, or the compiler's TypeScript IR just to start a Web project.

The experience looks much closer to things I have used for years:

```text
npm create ...
cargo new
go mod init
```

The internals are unusual.

The entrance is not supposed to be.

I wrote about that contrast here:

https://dev.to/kentaromorishita/inside-hkt-effect-core-ir-outside-seseragi-new-web

## The watcher has to understand the Seseragi project graph too

A single-file toy watcher is easy.

A real local project may depend on local packages.

If a dependency's `.ssrg` source or `seseragi.toml` changes, the root application needs to rebuild too.

So the current dev command derives watch roots from the project graph rather than simply watching the current directory and hoping for the best.

This is another funny escalation:

```text
I want browser reload
↓
now I am thinking about the canonical package graph
```

But that is exactly the right dependency.

The project model should be the source of truth for both build and dev tooling.

The dev server should not invent its own idea of what files belong to the application.

## Normal development loops make a language feel more real than feature counts do

A Playground is enough to demonstrate a language.

A compiler is enough to compile programs.

But something changes when I can run:

```sh
seseragi dev
```

edit in my normal editor, break the source, see diagnostics, fix it, and watch the browser return.

The language suddenly feels less like:

```text
something I am implementing
```

and more like:

```text
something I am developing with
```

That feeling did not come from adding another type-system feature.

It came from a very boring loop working reliably.

## Tooling has made me redefine what "language quality" means

When I started, it was easy to measure progress through syntax and semantics:

```text
Does match work?
Do generics work?
Can Effect run?
```

Now the questions include:

```text
Can I start a project easily?
Can I keep working through compiler errors?
Does the browser update?
Do source maps point back to the source?
Does Ctrl-C clean everything up?
```

Those are not peripheral once the goal is actual use.

They are part of the language experience.

https://github.com/KentaroMorishita/seseragi

The current dev server is still deliberately simple.

No HMR.

No SSR magic.

No framework router.

Just a dependable:

```text
edit -> rebuild -> reload
```

And somehow that made Seseragi look much more like a real programming language than several of the much fancier features did.