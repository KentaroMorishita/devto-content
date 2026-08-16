---
title: "Why Should a Function Wait Until I Give It Every Argument?"
published: false
tags: programming, functional, types, seseragi
description: "I kept writing tiny wrapper functions just to fix a few arguments. Then I started wondering why partial application needed to feel like a separate feature at all."
series:
main_image:
canonical_url:
---

In TypeScript, I sometimes want a function that is almost another function, except a few arguments are already fixed.

For example:

```ts
const surround = (
  left: string,
  right: string,
  value: string,
) => `${left}${value}${right}`

const bracket = (value: string) =>
  surround("[", "]", value)
```

There is nothing wrong with this.

But every time I look at `bracket`, the actual idea is extremely small:

**Fix the first two arguments of `surround`.**

That's it.

And yet I needed another lambda to say it.

Seseragi has been full of these moments for me: things that are not really painful enough to call a problem, but still make me ask, "Why does this need to look like that?"

## What if giving some arguments simply returned another function?

A Seseragi function with several parameters looks like this:

```rust
fn surround left: String
  -> right: String
  -> value: String
  -> String =
  `${left}${value}${right}`
```

And a normal call looks like this:

```rust
surround "[" "]" "hello"
```

But Seseragi does not treat that as one special operation where three arguments are delivered at once.

Function application associates to the left, so conceptually it is closer to:

```text
((surround "[") "]") "hello"
```

That means after supplying only the first argument, the result is still a function:

```rust
let withLeft = surround "["
```

And after supplying the second:

```rust
let bracket = surround "[" "]"
```

`bracket` is now just a function waiting for one `String`.

```rust
bracket "hello"
```

When I first got this working, my reaction was basically: **yeah, that's enough.**

I had written a separate wrapper in TypeScript because the language asked me to. In Seseragi, I could stop applying arguments halfway through and keep the function that remained.

The broader idea of values flowing through ordinary function application is something I wrote about here:

https://dev.to/kentaromorishita/what-if-programs-were-mostly-just-values-flowing-through-functions-3ebb

## This looks Haskell-like, but Haskell wasn't the starting point

In Haskell, this kind of thing looks completely ordinary:

```haskell
surround left right value = left ++ value ++ right

bracket = surround "[" "]"
```

Seseragi ends up looking pretty close.

But I did not begin with a requirement that said, "Seseragi must support currying like Haskell."

My background is mostly Web development. In TypeScript, PHP, or Python, if I needed a function with some arguments fixed, I would normally add a lambda or wrapper. In Go, an explicit closure is also often the natural answer.

That approach has a nice property: the fixed values are completely obvious in the code.

Seseragi took a different route.

If ordinary function application already happens one argument at a time, then this:

```text
supply some arguments
↓
receive the function that still remains
```

does not need to become a separate mechanism.

I think the interesting comparison is less "Haskell has currying, Seseragi has currying" and more this:

**For the same desire, do you write an explicit wrapper, or do you make partial application fall out of the meaning of function application itself?**

Both can be simple. They just put simplicity in different places.

## There is no partial-application syntax

This is probably my favorite part.

I did not add a special syntax for partial application.

There is no operator that means "freeze these parameters."

There is no separate declaration form.

A normal function accepts one argument and produces a value. That value may itself be another function.

So if you stop halfway, a function is what remains.

```rust
let bracket = surround "[" "]"
let quote = surround "\"" "\""
```

That gives me small reusable functions without another lambda each time.

The theory words are *currying* and *partial application*, and those words are useful. But the thing I wanted came first:

**Decide part of the input now. Give the rest later.**

Once that ordinary desire became natural to write, the theory already had a name for the result.

That order feels much more like how Seseragi has developed in general.

## A partially applied function is just another value

This also changes how I think about the result:

```rust
let bracket = surround "[" "]"
```

`bracket` is not a special kind of function declaration.

It is simply the value produced by evaluating:

```rust
surround "[" "]"
```

and binding that value with `let`.

That pattern keeps appearing in Seseragi.

Whenever I can avoid introducing a special world and let ordinary values and functions carry the idea instead, I usually prefer that.

There is a funny comparison with Go here.

I sympathize a lot with Go's instinct to avoid unnecessary concepts, but the answers are almost opposite.

Go keeps function arity explicit and makes the wrapper or closure explicit too.

Seseragi makes application one argument at a time, which removes the need for a separate partial-application mechanism.

Same instinct: don't multiply concepts unnecessarily.

Completely different foundation.

That's the kind of language comparison I find much more interesting than just lining up syntax.

## Then tooling has to tell the truth too

Once partial application is an ordinary value, the tooling has to understand it as an ordinary value as well.

For example:

```rust
let bracket = surround "[" "]"
```

At that point, the type of `bracket` is:

```text
String -> String
```

If I only supply one argument to `surround`, then two inputs are still left.

Seseragi's Analysis API and hover information are supposed to show the remaining function type after partial application.

https://github.com/KentaroMorishita/seseragi/issues/89

This is one of those places where a tiny language rule keeps walking downward into the implementation.

If the syntax lets me partially apply a function but the IDE keeps showing only the original three-argument shape, the tool is telling half the truth.

I like that language design does this. A rule that looks almost trivial on paper eventually demands consistency from the parser, type checker, analysis API, editor, and Playground.

## Try stopping halfway in the Playground

The current Tour has a sample close to this:

```rust
fn surround left: String
  -> right: String
  -> value: String
  -> String =
  `${left}${value}${right}`

let bracket = surround "[" "]"
let quote = surround "\"" "\""

pub effect fn main =
  println `${bracket "ready"} ${quote "go"}`
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Try changing:

```rust
let bracket = surround "[" "]"
```

to:

```rust
let bracket = surround "["
```

Now `bracket` is still waiting for two `String` values.

Or keep the original definition and change:

```rust
bracket "ready"
```

to:

```rust
bracket 42
```

The compiler can tell you that the remaining parameter is a `String`.

The thing that changed my mental picture was surprisingly small:

A function is not necessarily a box that waits until every argument has arrived.

**Give it one value, and the result may simply be the next function.**

Once that becomes the ordinary model, partial application stops feeling like an advanced feature.

It is just what happens when you stop applying arguments.