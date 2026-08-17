---
title: "Making the Last Expression the Value of a Block Changed More Than I Expected"
published: false
tags: programming, rust, types, seseragi
description: "I only wanted a local scope while constructing one value. Making blocks expressions removed an IIFE, made return feel optional, and changed how I read the whole language."
series:
main_image:
canonical_url:
---

Sometimes I want to give a name to an intermediate value.

But I do not want that name to escape into the surrounding scope.

This is a tiny problem, but building Seseragi has trained me to stop dismissing tiny problems quite so quickly.

Suppose I am writing TypeScript and only need a local variable while constructing one value:

```ts
const message = (() => {
  const adjective = "local"
  return `A ${adjective} value`
})()
```

This works.

But I wanted one value and somehow ended up creating a lambda and immediately calling it.

I could also move the intermediate variable outside:

```ts
const adjective = "local"
const message = `A ${adjective} value`
```

That is simpler, but now `adjective` lives in a scope where I never actually needed it.

The thing I wanted was not really a function.

**I wanted a small local scope while constructing a value.**

## Rust already has a very natural answer

Rust blocks are expressions, so this is straightforward:

```rust
let message = {
    let adjective = "local";
    format!("A {adjective} value")
};
```

The final expression becomes the value of the block.

Seseragi ended up looking quite close to this.

But I did not start from "I should import Rust's block-expression design."

My path was much more mundane.

I had written IIFEs in TypeScript. I had let temporary names leak into larger scopes in PHP and Python. Eventually the thought became:

```text
I don't need another function here.
I just need a scope while I build this value.
```

Once I phrased the problem that way, making the block itself a value started to feel obvious.

Then I looked at Rust and thought: right, of course somebody already landed here.

That kind of convergence is one of my favorite parts of language design.

Go, Python, and PHP draw the statement/expression boundary differently. A block is not simply an arbitrary expression you can drop into a value position.

That is not a flaw. A stronger distinction between statements and expressions can make code easier to read too.

Seseragi chose the opposite direction because I wanted fewer moments where ordinary value-oriented code suddenly had to descend into a separate statement world.

Same desire for readable code. Different place to draw the line.

## What if the block itself is the value?

In Seseragi:

```rust
let message = {
  let adjective = "local"
  `A ${adjective} value`
}
```

The final expression is the value of the entire block.

There is no `return` here.

The String expression:

```rust
`A ${adjective} value`
```

is simply what gets bound to `message`.

The Tour uses almost exactly this sample:

```rust
let message = {
  let adjective = "local"
  `A ${adjective} value`
}

pub effect fn main = println message
```

It is not an impressive feature demo.

I really like it anyway.

## I don't need to invent a function just to get a scope

The useful part becomes more obvious when there are several intermediate values:

```rust
let summary = {
  let name = "Seseragi"
  let status = "experimental"
  `${name}: ${status}`
}
```

`name` and `status` only exist while `summary` is being constructed.

From the outside, there is just one value: `summary`.

I do not need a helper function.

I do not need an immediately invoked lambda.

I do not need to expose implementation-detail names to the surrounding scope.

The block gives me exactly the amount of structure I wanted and no more.

This sounds almost laughably small, but these are the features I tend to appreciate most after using a language for a while.

## A block stops looking like "a bunch of things to do"

Before this, I tended to picture a block as a container for statements.

Do this.

Then this.

Then this.

Once the final expression becomes its value, the block starts looking different:

```rust
{
  let adjective = "local"
  `A ${adjective} value`
}
```

This is not merely "a block that runs some code."

It is **one expression that happens to contain local bindings while producing its result**.

That means it can naturally appear on the right-hand side of `let`.

It can participate in larger expressions.

And it points in the same direction as Seseragi's `if` and `match`: when I need a result, I want to place the expression that produces that result directly where the result is needed.

I wrote about the same instinct from the branching side here:

https://dev.to/kentaromorishita/i-tried-to-eliminate-if-i-ended-up-putting-match-in-my-language-41b6

The exact syntax is different, but the feeling is the same.

Keep following values as long as possible.

## I didn't start by trying to remove `return`

This is where the design order matters.

It would be easy to describe this as:

"I dislike `return`, so I made block expressions."

That is not really what happened.

I had written `return` in TypeScript, Go, Python, and PHP for years without thinking much about it.

First, the block became a value.

Then I looked at something like:

```text
return result
```

at the end of a block and thought:

**If the block already has a value, what extra information is `return` giving me here?**

Suddenly something that had always felt mandatory became optional.

That has happened repeatedly while building Seseragi.

A familiar language feature does not necessarily feel bad in an existing language. But if I rebuild the surrounding rules from scratch, I sometimes discover that the familiar feature was only necessary because of those surrounding rules.

That moment — when something "obvious" turns back into a design choice — is probably the most fun part of building a language.

## The absence of `return` reinforces the same reading style

Consider:

```rust
let priceLabel = {
  let price = 1200
  `¥${price}`
}
```

The final thing is a String.

Therefore the block is a String.

That is very easy to read once the rule becomes familiar.

And it fits with other Seseragi constructs.

A `match` arm produces a value.

An `if` expression produces a value.

A function body produces a value.

If blocks alone suddenly became a statement-only island, the language would keep making me switch mental models.

I would rather stay in the "what value does this produce?" model until something genuinely requires a different responsibility.

That same preference shows up all over Seseragi, including Effect, Signal, and UI.

## Tiny rules become surprisingly important later

A block expression by itself is not a revolutionary feature.

If you already know Rust, it probably looks completely ordinary.

But as Seseragi grew, this small rule started paying rent everywhere.

When building UI, I sometimes need local intermediate values.

When writing Effect code, I still need ordinary local transformations.

When constructing a slightly complicated Record or String, I often want a name that should exist for five lines and nowhere else.

I do not need a new construct for each of those cases.

The rule is still:

**the final expression of a block is the value of the block.**

That's all.

And because it is all, more of the language keeps feeling like values being constructed rather than statements being orchestrated.

## Add another local binding in the Playground

You can try the Tour sample here:

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Start with:

```rust
let message = {
  let adjective = "local"
  `A ${adjective} value`
}

pub effect fn main = println message
```

Then add another local binding:

```rust
let message = {
  let adjective = "local"
  let noun = "value"
  `A ${adjective} ${noun}`
}
```

`noun` does not exist outside the block.

The block itself is still just a String value.

That small experiment captures a lot of what I want Seseragi to feel like.

I am not trying to make ordinary programming look exotic.

**I just want ordinary processing to remain an ordinary expression for as long as possible.**