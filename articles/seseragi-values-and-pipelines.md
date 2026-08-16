---
title: "What If Programs Were Mostly Just Values Flowing Through Functions?"
published: false
zenn_published_at: "2026-08-04T08:21:00+09:00"
tags: programming, typescript, functional, seseragi
description: "I like code where I can see a value move from one transformation to the next. Seseragi's pipeline and $ operators grew out of that very ordinary preference."
series:
main_image:
canonical_url:
---

I've never particularly enjoyed reading code that makes me suddenly switch from following values to chasing control flow.

A variable gets assigned halfway through.

A function returns halfway through.

An `if` redirects the path.

Then the value gets another name.

None of this is difficult to understand.

But when I'm tired, I eventually end up asking:

**"So where did this value come from, and where is it going?"**

I started wondering whether it would simply be easier if the code showed how a value changes as it moves through the program.

## TypeScript can already feel like this

For example, filtering, mapping, and reducing an array:

```ts
const total = [1, 2, 3, 4, 5, 6]
  .filter(even)
  .map(double)
  .reduce(add, 0)
```

I like this a lot.

The transformations are visible in order.

But once the value isn't an Array anymore, or ordinary functions need to enter the chain, method chaining stops being a universal model.

So we add a `pipe` helper or install a library.

Then there is another library-specific convention to learn.

This was one of the things I kept thinking about while I was building F-Box.

The old F-Box projects are still here:

https://github.com/KentaroMorishita/f-box-core

https://github.com/KentaroMorishita/f-box-react

## In Seseragi, I wanted the value to keep flowing

The current Tour contains a sample like this:

```rust
import * as arrays from "std/array"

fn even value: Int -> Bool =
  value % 2 == 0

fn double value: Int -> Int =
  value * 2

let total =
  [1, 2, 3, 4, 5, 6]
  |> arrays.filter even
  |> map double
  |> reduce 0 (+)

pub effect fn main =
  println $ `pipeline total: ${total}`
```

That's basically it.

The value moves from left to right.

Filter it, map it, reduce it.

This isn't Array-specific magic.

`|>` is ordinary function application written in a way that makes the direction of the data easier to read. If the functions stay small, the same shape can keep going.

## I like `$` for the same reason

Another operator I use constantly in Seseragi is `$`.

```rust
pub effect fn main =
  println $ `pipeline total: ${total}`
```

There isn't a grand theoretical claim hiding here. A lot of the time I simply want fewer parentheses.

Instead of:

```text
println(foo(bar(baz(x))))
```

I would rather read:

```text
println $ foo $ bar $ baz x
```

My eyes find that easier.

Maybe this is an age-related feature request.

But Seseragi pays a lot of attention to things that are theoretically small and practically visible every day.

## I care more about making ordinary code pleasant than making unusual code impressive

When people hear "I made a programming language," it's natural to expect an exotic type system or some syntax nobody has seen before.

Seseragi does have things that sound intimidating when listed out: type classes, Effect, Signal, and so on.

But some of the parts that make me happiest are much more boring.

Write a function.

Give it a value.

Send the result to the next function.

**Make ordinary processing feel ordinary and pleasant.**

If that foundation is uncomfortable, adding sophisticated abstractions on top of it probably won't make the language enjoyable to use.

## Play with it

https://seseragi.vercel.app/

Paste the sample above and try things like:

- change `even` to `value > 3`
- make `double` triple the value instead
- add another `map double`
- break the pipeline across lines
- remove the pipeline and rewrite it as nested function application

That last one isn't a feature test.

It's a preference test.

But language design is, in the end, partly an accumulation of preferences like that.