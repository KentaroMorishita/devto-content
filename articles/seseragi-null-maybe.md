---
title: "Why Does null Get to Pretend It's a Normal Value?"
published: false
zenn_published_at: "2026-08-03T21:34:00+09:00"
tags: typescript, programming, functional, seseragi
description: "I don't think null is evil. I just prefer absence to have an explicit shape once a value crosses into my program. That's where Maybe comes in."
series:
main_image:
canonical_url:
---

If you write TypeScript, `null` and `undefined` are just part of life.

That's normal.

But I've always found them slightly uncomfortable.

A value may exist.

It may not exist.

So far, so good.

What bothers me is how naturally "not there" can walk into the same world as ordinary values and sit down like nothing happened.

```ts
const user = users.find(x => x.id === id)

user.name
```

TypeScript complains, correctly.

`user` may be `undefined`.

This isn't TypeScript failing to help. TypeScript is being nice here.

But if every encounter with absence turns into another branch like:

```ts
if (!user) {
  // ...
}
```

then the code gradually becomes more about avoiding a null-like value than about the actual fact I wanted to model:

**there may be no user.**

I never liked that very much.

## If it may be missing, I want that to be the shape

I was already using Maybe for this kind of thing when I built F-Box.

The old implementation is still here:

https://github.com/KentaroMorishita/f-box-core

https://github.com/KentaroMorishita/f-box-react

Seseragi follows the same idea. If a value may be absent, I want that visible as `Maybe<A>` from the beginning.

The Tour has a small sample like this:

```rust
fn withDefault fallback: String
  -> value: Maybe<String>
  -> String =
  match value {
    Nothing -> fallback
    Just item -> item
  }

let name: Maybe<String> = Nothing

pub effect fn main =
  withDefault "Guest" name
  |> println
```

Nothing fancy is happening.

`name` is not a String.

It is **a value that may contain a String**.

So the code using it handles `Nothing` and `Just item` as ordinary cases.

That "ordinary" part matters to me.

I don't want a special null-checking language bolted onto the rest of the language.

There is a data shape called `Maybe`.

There is an ordinary expression called `match`.

I'd like that to be enough.

## Transforming only the present value shouldn't require a new control structure either

Maybe can be mapped.

If a value exists, transform it.

If it is `Nothing`, keep it `Nothing`.

Seseragi lets you write that with `map`, or with `<$>` if you like the operator form.

There is more to say about Functor there, but I'd rather keep that in an article where Functor is actually the point.

If an article about Maybe starts pasting three nearly identical Maybe examples, the article itself becomes the problem.

## I'm not trying to ban null

Discussions like this can turn into "is null evil?" very quickly.

I'm not interested in that religious war.

If the outside world contains null, then of course a boundary has to deal with it.

JSON has it. JavaScript has it.

What I don't want is to carry that external representation through the entire inner model of the program.

Accept the outside world's shape at the boundary.

Then turn it into something meaningful on the inside.

That's all.

## Break it in the Playground

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Paste the `withDefault` example and first change:

```rust
Nothing
```

to:

```rust
Just "Kentaro"
```

Then try things like:

- change the example to `Maybe<Int>`
- remove the `Nothing` arm from the `match`
- continue through the Tour until you reach `map`
- nest `Just` inside `Just` and enjoy the immediate feeling that you've probably modeled the wrong thing

I think Maybe is easier to understand by touching it than by beginning with category theory.

For what it's worth, I once spent about three months of train rides thinking about this family of ideas.

Looking back, I apparently had a lot of free mental bandwidth.