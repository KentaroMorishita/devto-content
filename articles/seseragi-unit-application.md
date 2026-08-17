---
title: "Does a Zero-Argument Function Really Have Zero Arguments?"
published: false
tags: programming, functional, types, seseragi
description: "I stopped treating empty parentheses as special call syntax and started treating Unit as an ordinary value. That tiny choice made function application feel much more uniform."
series:
main_image:
canonical_url:
---

In JavaScript or TypeScript, calling a function with no arguments looks like this:

```ts
heading()
```

If there are no arguments, the parameter list is empty.

Python, PHP, and Go all have their own syntax, but the mental model is usually similar: call a function whose argument list happens to contain nothing.

I had looked at that for years without thinking twice.

Then I started building a language, which is apparently a reliable way to become suspicious of completely ordinary punctuation.

**Does a zero-argument function really have zero arguments?**

## In Seseragi, `()` is not call syntax

Seseragi has `()` too.

But it is not an empty pair of call parentheses.

It is the single value of the `Unit` type.

```rust
()
```

It is an ordinary value, so it can appear anywhere a value can appear.

```rust
pub effect fn main = println `Unit: ${()}`
```

The Tour deliberately introduces `()` as a Unit value rather than as punctuation attached to a function call.

https://seseragi.vercel.app/tour/

So far, that is not especially exotic. Plenty of languages have a Unit-like value.

The interesting part appeared when I had to decide what a function that receives no meaningful information should actually mean.

## It looks parameterless, but semantically it is `Unit -> A`

Seseragi lets me write:

```rust
fn heading -> String = "Hello"
```

There is no visible parameter.

But semantically, I treat this as a function with one unnamed `Unit` input.

Its shape is:

```text
Unit -> String
```

So calling it looks like this:

```rust
heading ()
```

That space matters.

This is not a separate `heading()` call form.

It is ordinary function application:

**apply the value `()` to the function `heading`.**

That is the same function-application model used everywhere else in Seseragi.

The previous article in this series goes into why arguments are applied one at a time and why stopping halfway leaves another function:

https://dev.to/kentaromorishita/why-should-a-function-wait-until-i-give-it-every-argument-1a4p

## The same `()` means surprisingly different things across languages

In TypeScript:

```ts
function heading(): string {
  return "Hello"
}

heading()
```

The parentheses appear in both the parameter list and call syntax.

Rust looks similar:

```rust
fn heading() -> String {
    "Hello".to_string()
}
```

That is a zero-argument function. It is not modeled as a function receiving one Unit value.

In Haskell, if I really want a function from Unit to String, I can write:

```haskell
heading :: () -> String
heading () = "Hello"
```

That looks much closer to what Seseragi means.

But Haskell also makes it completely natural to write a value instead:

```haskell
heading :: String
heading = "Hello"
```

If no input is required, there is often no reason for the thing to be a function at all.

That contrast was interesting to me.

Seseragi did not simply copy Haskell's Unit-function style. I kept the visually convenient parameterless `fn` declaration, but **normalized its meaning back into an ordinary one-argument function**.

So the surface ends up somewhere between familiar Web-language syntax and a more uniform function-application model.

I did not plan that compromise in advance. It mostly emerged from refusing to add another special case.

## I didn't want a second call rule just for empty arguments

Ordinary Seseragi application uses whitespace:

```rust
add 1
map double values
heading ()
```

All three can be read using the same rule.

If parameterless functions instead used:

```text
heading()
```

then empty parentheses would suddenly mean "call this function," even though other calls are ordinary application.

That would be perfectly workable. In fact, after years of TypeScript, Go, Python, and PHP, it is the syntax I am more used to seeing.

But while building Seseragi, small special cases like this started bothering me more and more.

If there is no information to pass, why not pass the value that represents exactly that?

That value is `()`.

Now zero-information application still uses the same rule as every other application.

I sympathize with Go's "don't add concepts you don't need" instinct quite a lot, yet the syntax I ended up with is almost the opposite of Go.

That's one of the funny parts of language design: the same taste for simplicity does not imply the same answer. It depends on which rule you decide is fundamental.

## This quietly shows up in Web UI too

Seseragi's UI samples made this choice feel less theoretical than I expected.

A component that receives no meaningful input can look like this:

```rust
import * as html from "std/web/html"

type Action =
  | NoAction

fn heading -> html.Html<Action> =
  html.h2 { children: "Component" }

pub effect fn main =
  heading ()
  |> html.renderToString
  |> println
```

`heading` is not special component syntax.

It is just a function.

And invoking it is not special component invocation either.

It is ordinary Unit application.

When I wrote about components being ordinary functions, the interesting part looked much larger:

https://dev.to/kentaromorishita/couldnt-a-component-just-be-a-function-5feo

But underneath that experience are tiny rules like this one.

No separate component call syntax.

No separate empty-call syntax.

Just values and function application continuing to work.

I think these small rules are a large part of why a language starts feeling coherent rather than merely having a list of nice features.

## `()` does not mean "nothing exists"

This is the part of Unit I like most.

There is a value.

There is just exactly one possible value.

So:

```text
Unit -> A
```

is not a function that receives useful information, but it is still an ordinary one-input function.

That lets a parameterless-looking function stay inside the same model as every other function.

Curried functions, partially applied functions, and Unit-taking functions all end up using the same application rule.

That makes my brain unexpectedly happy for such a small piece of syntax.

## Try passing Unit in the Playground

You can try the sample directly here:

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Start with:

```rust
fn heading -> String = "Hello"

pub effect fn main =
  heading ()
  |> println
```

Then replace:

```rust
heading ()
```

with:

```rust
heading 1
```

`heading` is waiting for `Unit`, not `Int`, so this becomes an ordinary type error.

And if you look at `()` by itself, it is simply a Unit literal.

That is the mental shift I wanted:

**I am not "calling a function with no arguments." I am applying Unit to a function.**

Visually, the difference is one space.

Semantically, it removes an entire special case.

Apparently this is the kind of thing I now get excited about.