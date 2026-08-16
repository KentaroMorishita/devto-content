---
title: "TypeScript Is a Backend, Not the Language"
published: true
zenn_published_at: "2026-08-09T11:31:00+09:00"
tags: typescript, rust, programming, seseragi
description: "Seseragi currently targets TypeScript and JavaScript, but I learned the hard way that the target language's constraints should not quietly become the source language's semantics."
series:
main_image:
canonical_url:
---

Seseragi currently uses TypeScript / JavaScript as one of its execution targets.

If that's the first thing you hear about it, a reasonable reaction is:

**"So is it basically TypeScript syntax sugar?"**

At one point, it almost was.

The first implementation stayed very close to TypeScript because that was by far the easiest way to get something running.

Parse a little syntax.

Transform it.

Emit TypeScript.

Done.

That worked surprisingly well for a while.

Then the language grew, and the architecture started feeling wrong.

## Is this a Seseragi rule or a TypeScript workaround?

The early compiler was simple.

Then Maybe arrived.

Either arrived.

Effect arrived.

Type classes arrived.

Signal arrived.

Web UI arrived.

And the transformation code gradually started mixing three different questions:

- what a Seseragi program means
- how that meaning should be represented in TypeScript
- what the JavaScript runtime needs in order to execute it

A small change in one place would break something surprisingly far away.

That is usually the point where my internal design detector emits its most sophisticated diagnostic:

**This feels ugly.**

## So I rebuilt the compiler

The current Seseragi compiler is being rebuilt in Rust.

Very roughly, the path looks like this:

```text
Source
  ↓
CST / AST
  ↓
name resolution / type checking
  ↓
Typed HIR
  ↓
Core IR
  ↓
TypeScript IR
  ↓
TypeScript + source map
```

Listing all those names makes this article sound much more like a compiler article than the way I originally learned the idea.

At the beginning I barely knew what IR was supposed to buy me.

The useful realization was much simpler:

I need one place for **what this means in Seseragi**, and another place for **how TypeScript happens to implement that meaning**.

There needs to be a boundary between them.

## TypeScript is not the enemy

This part matters.

I am not trying to escape TypeScript because I dislike it.

I use it constantly.

The JavaScript ecosystem is enormous. Browsers run it. Servers run it. Tooling is everywhere.

I want to take advantage of that.

What I don't want is for every person writing Seseragi to carry Promise details, JavaScript ABI details, and backend-runtime decisions all the way up into their source code.

The semantics I want the language to guarantee should live on the Seseragi side.

How those semantics execute is a backend problem.

That separation is the important part.

## I'm not promising every backend under the sun

Once a compiler has a Core IR and a backend boundary, the obvious questions appear immediately:

"Could you add LLVM?"

"Could it compile to native code?"

"Could you emit WASM directly?"

Architecturally, those questions are easier to ask now than they were before.

That does not make them implemented.

Memory management exists.

ABIs exist.

Async exists.

Runtime semantics exist.

Saying "another backend should be possible" is much easier than building one correctly.

So right now I want TypeScript to become a solid first backend.

Designing an architecture that leaves room for the future is not the same thing as pretending the future has already been implemented.

Codex occasionally starts dreaming ahead here too, and I have to pull it back.

## Not knowing compiler architecture made the lesson more interesting

I wasn't a compiler expert when I started Seseragi.

The original plan was more or less:

"Parse this and generate TypeScript. That should be enough."

Then I got to experience exactly why it stops being enough as the system grows.

Only after that did I start understanding why the responsibilities in compiler architecture are separated the way they are.

I actually like that path.

I didn't memorize an architecture diagram and then implement it.

**The changes started feeling ugly, I investigated why, and compiler architecture appeared at the bottom of the hole.**

A lot of Seseragi has developed that way.

## The Playground runs through the same compiler boundary

https://seseragi.vercel.app/

The compiler used in the Playground isn't intended to be a separate toy implementation.

The CLI, LSP, WASM Playground, and other surfaces are being built around the same compiler-driver boundary.

That matters to me too.

A language where one sample works in the Playground, VS Code reports different types, and the CLI behaves differently would be miserable to use.

I didn't begin this project because I wanted to study compiler internals.

I just kept finding more places where the language's meaning needed a clear owner.

The symptoms continue to progress nicely.