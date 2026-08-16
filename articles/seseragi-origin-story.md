---
title: "I Didn't Mean to Build a Programming Language"
published: true
zenn_published_at: "2026-07-31T08:12:00+09:00"
tags: programming, typescript, codex, seseragi
description: "I didn't set out to build a compiler. I kept asking why everyday code had to feel this way, and eventually those questions turned into Seseragi."
series:
main_image:
canonical_url:
---

I'm building a programming language.

Written like that, it sounds as if I had always dreamed about compilers, read the Dragon Book cover to cover, and spent years waiting for the day I could finally design my own language.

Not even close.

I was just writing ordinary web applications and constantly thinking things like:

"Why do I have to write it this way here?"

or:

"Wouldn't this feel better if I could write it a little more directly?"

I kept digging into those small annoyances instead of ignoring them, one by one, and somehow they turned into a programming language.

It's called **Seseragi**.

https://github.com/KentaroMorishita/seseragi

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

It's still experimental and pre-release, but a Rust compiler, CLI, LSP, formatter, WASM Playground, Signal, and Web UI are already working to a surprising degree.

Even I sometimes look at it and think, "How far is this thing going?"

## It started with being tired of `if`

In 2024, I wrote this article on Qiita.

https://qiita.com/KentaroMorishita/items/6329d20fbc6f98f72864

The title alone probably tells you I was already heading somewhere weird.

I don't think I hated `if` itself. What bothered me was the feeling of tracing conditional branches as **statements**.

That was also why I liked ternary expressions. Not just because they were short.

They were expressions, so I could take the result directly as a value.

```ts
const label = isLoading
  ? "Loading..."
  : hasError
    ? "Error"
    : "Ready"
```

Of course, once these grow, they become painful too.

So I started building my own `match` and `when` abstractions on top of TypeScript.

Looking back, I was trying pretty hard to fight the language.

But the underlying desire was already clear:

**I'd rather construct values than chase control flow.**

When I look at Seseragi now, the symptoms had started long before the language existed.

## There was a period when I thought about monads on the train every day

Around the same time, I spent about three months thinking about monads during my commute.

I didn't need them for work.

Nobody told me to study them.

I just got curious and started talking things through with GPT every day.

This is probably where things got even stranger.

Functor. Applicative. Monad.

At first I only wanted to understand the terminology. Then the question slowly changed into:

"Wouldn't it feel good if I could just use this naturally in TypeScript?"

Eventually, thinking about it wasn't enough anymore.

## So I built F-Box on top of TypeScript

That became **F-Box**.

https://github.com/KentaroMorishita/f-box-core

https://github.com/KentaroMorishita/f-box-react

Maybe, Either, Task, `<$>`, `<*>`, `>>=`, and do notation.

I wanted values to compose as directly as possible inside TypeScript.

I even wrote articles like these on Zenn.

https://zenn.dev/ken_morishita/articles/568efda2211f6d

https://zenn.dev/ken_morishita/articles/34a0860d7e7731

What was I doing?

Still, the time I spent building F-Box turned out to matter a lot.

You can do quite a lot in TypeScript if a library works hard enough.

You really can.

But the harder I pushed the library, the more another thought kept coming back:

**Maybe this isn't the library's job.**

## The harder the library worked, the more visible the language boundary became

You can implement Maybe in TypeScript.

You can implement Either.

You can implement Task.

You can curry functions. You can even imitate do notation with a library.

But underneath all of that, you're still standing on TypeScript's syntax and semantics.

At some point, what I wanted was no longer a "useful library."

I was thinking about more fundamental things:

- I want the shape of data to be written directly.
- I want branching to feel like working with values.
- I want failure to stay visible as a value too.
- I want interactions with the outside world to be visible from the type.
- If state changes over time, I want that to still feel like an extension of values.
- I don't want UI code to suddenly drop me into a completely different world.

If that's what I wanted, maybe I should just make a language where those things are normal from the beginning.

Would that be faster?

No. Absolutely not.

I started anyway.

## Then I started building Seseragi

Seseragi currently looks something like this:

```rust
fn fizzBuzz number: Int -> String =
  match (number % 3, number % 5) {
    (0, 0) -> "FizzBuzz"
    (0, _) -> "Fizz"
    (_, 0) -> "Buzz"
    _ -> `${number}`
  }

pub effect fn main =
  for number <- 1 ..= 30 {
    println $ fizzBuzz number
  }
```

I'm not trying to show anything particularly exotic with this example.

Actually, the opposite.

What I like is that it just looks readable.

`match` is an expression. Functions produce values. `$` removes some unnecessary parentheses. And the point where the program finally touches the outside world is visibly marked as `effect`.

All of that is connected to what I was thinking about while building F-Box, but now these ideas can live as ordinary language features instead of conventions enforced by a library.

That feels surprisingly good.

## And somehow it started writing web applications too

At first, just getting the compiler to run small programs was exciting enough.

Then I added Signal. DOM rendering started working. HTML became something I could construct as an ordinary value. Forms started working too.

Now the Playground Tour includes code like this:

```rust
struct Model {
  draft: String,
  pinned: Bool,
  status: String
}

type Action =
  | DraftChanged String
  | PinnedChanged Bool
  | Submitted

fn update action: Action
  -> model: Model
  -> Model =
  match action {
    DraftChanged value ->
      Model {
        ...model,
        draft: value,
        status: "Editing"
      }

    PinnedChanged value ->
      Model {
        ...model,
        pinned: value
      }

    Submitted ->
      Model {
        ...model,
        status: `Saved: ${model.draft}`
      }
  }
```

`Model`, `Action`, and `match` aren't special Web UI syntax.

They're just normal data types and normal functions. From there, Signal and Html continue the same story.

That sense of **not having to learn a different language halfway through the program** is one of the things I currently like most about Seseragi.

Sometimes I'm in the Playground, writing a web app in my own programming language, and I genuinely stop understanding what exactly I'm building anymore.

But it's fun.

## Try breaking it in the Playground

Seseragi isn't finished, so in some ways it's easier to understand by poking at it than by reading an explanation.

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

A simple place to start is to paste in the FizzBuzz example above and change things:

- Change `1 ..= 30` to `1 ..= 100`.
- Add a rule for 7 as well as 3 and 5.
- Delete one `match` arm and see what happens.
- Add another function and connect things with `$` or a pipeline.

If you want to touch the Web side, keep going through the Web UI section of the Tour. You can play with the path from Signal all the way to DOM rendering.

## I still build most of this during my commute

After all this, it might sound as if I spend my entire day writing a compiler.

I don't. I have a regular job.

Most of the time I touch Seseragi in small fragments of free time: on the train, during breaks, things like that.

These days, I often look at an Issue on my phone and hand work to Codex from there.

```text
Get on the train
↓
Open my phone
↓
Read an Issue
↓
Give it to Codex
↓
Go to work
```

Sometimes I check again at lunch and a ridiculous amount of Rust has appeared.

It's a strange time to be building software.

But the more implementation I can delegate to AI, the more I find myself thinking about things that can't simply be delegated away: what exactly the feature should mean, where one responsibility ends, and what should or shouldn't belong to Seseragi's world.

Fast implementation means a bad design can become fully implemented just as fast.

So if it feels weird, I undo it.

I want to write more about that too.

## Maybe only the thing I think about on the train has changed

Looking back, I used to spend my commute thinking about monads.

Then I built F-Box on top of TypeScript.

Now I spend the same commute looking at compiler Issues on my phone.

I'm not sure whether this counts as growth or deterioration.

But I think I've been asking basically the same question the whole time:

**"Couldn't this feel a little better to write?"**

Seseragi is probably what happened because I kept digging into that question.

It's nowhere near finished yet.

Which is exactly why this is probably the most interesting time to write about it.

From here I want to write about the things that bothered me in TypeScript, ADTs, Effect, Signal, UI, the compiler, the Playground, and the decisions that appeared along the way—not as a language reference, but starting from **why I wanted things to be different in the first place**.

If any of this sounds interesting, try the Playground.

I'd also be genuinely happy if you just looked through the GitHub Issues.

And if you're feeling adventurous, pick one and try it with Codex. That's basically the workflow I'm using anyway.
