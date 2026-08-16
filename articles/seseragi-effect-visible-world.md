---
title: "I Don't Want to Eliminate Side Effects. I Want to See Them."
published: false
zenn_published_at: "2026-08-05T21:37:00+09:00"
tags: programming, functional, typescript, seseragi
description: "Real applications are full of effects. I don't want to pretend otherwise. I want the boundary between ordinary value transformations and the outside world to remain visible."
series:
main_image:
canonical_url:
---

I've always thought the phrase "side effect" sounds a little unfair.

It makes effects sound like something suspicious happened.

But real applications are full of them.

Render something on screen.

Make an HTTP request.

Read a file.

Read the clock.

Write to a database.

I obviously don't want to eliminate all of that.

If I did, nothing would happen.

What bothers me isn't the existence of effects so much as **losing track of where the program crosses into the outside world**.

## Sometimes async/await feels like the conversation moved sideways

When JavaScript or TypeScript interacts with the outside world, a Promise is very often involved.

```ts
const response = await fetch(url)
const json = await response.json()
```

This is normal code. It's convenient.

But sometimes I look at it and think:

I don't actually want to "work with a Promise."

**I want to make an HTTP request.**

Promise matters enormously to JavaScript's execution model. But that doesn't mean I want the *meaning* of my whole program to be organized around Promise too.

That distinction became important while designing Seseragi.

## Crossing into the outside world is visible as Effect

The smallest Tour example is almost comically boring:

```rust
pub effect fn main = do {
  println "first"
  println "second"
}
```

It prints two lines.

That's it.

But I like how boring it is.

`println` does something outside the world of ordinary value transformation.

So the function that performs it is visibly an `effect fn`.

Meanwhile, a normal transformation doesn't need to become Effect just because Effect exists somewhere else in the program:

```rust
fn double value: Int -> Int = value * 2
```

This is just a function from a value to another value.

I find code easier to read when those two kinds of things don't silently look identical.

## I don't want do notation to become the main character

I built do notation in F-Box too.

The old projects are still here:

https://github.com/KentaroMorishita/f-box-core

https://github.com/KentaroMorishita/f-box-react

I like do notation.

But I don't want Seseragi to become "the language where you can write `do`."

`do` is surface syntax that makes sequential Effect code convenient to read.

The more important distinction is:

**Is this an ordinary transformation of values, or is this interaction with the outside world?**

If that distinction survives, I don't particularly care whether a backend eventually implements something using Promise, `fetch`, or some other runtime mechanism.

That lower layer can deal with the machinery.

## Treating effects as evil makes practical code miserable

I like pure functions.

Code where I can understand the output from the input alone is pleasant to work with.

But after years of building Web applications, I have no interest in purity as an end in itself.

Programs need to interact with things.

That interaction matters precisely enough that I don't want it mixed casually into everything else.

For me, the comfortable position is not "avoid effects."

It's "make the boundary visible."

## Try it in the Playground

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Paste the example and try:

- add a third `println`
- create an ordinary function and print its result
- change the order inside `do`
- continue further into the Effect part of the Tour until failure and capabilities appear

Seseragi's Effect system is still evolving, so details here may continue to change.

But one principle I don't want to lose is this:

**the outside world's implementation details should not spread backward until every ordinary value in the program has to care about them.**

That boundary matters a lot to me.