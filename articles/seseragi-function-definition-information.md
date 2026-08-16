---
title: "What If a Function Definition Looked Like Its Type?"
published: false
tags: programming, functional, types, seseragi
description: "Seseragi's function syntax looks unusual because it has no parameter-list parentheses. The part I actually like is that removing parameter names leaves the function type almost unchanged."
series:
main_image:
canonical_url:
---

A Seseragi function can be defined like this:

```rust
fn add a: Int -> b: Int -> Int =
  a + b
```

At first, the obvious visual differences are the missing parameter-list parentheses and commas.

But after using this syntax, those stopped being the part I liked most.

Remove the parameter names:

```rust
Int -> Int -> Int
```

The function type is still sitting there almost untouched.

**When I look at the function definition, I can see the function's type directly inside it.**

That may be the most interesting part of Seseragi's `fn` syntax.

## The parameter names sit on the inputs of the function type

Look at the definition again:

```rust
fn add a: Int -> b: Int -> Int =
  a + b
```

The type by itself is:

```rust
Int -> Int -> Int
```

Put the parameter names back:

```rust
a: Int -> b: Int -> Int
```

In my head, this is less like "write two parameters, then write the return type" and more like:

**take the function type `Int -> Int -> Int` and give its two inputs the names `a` and `b`.**

The function type comes first conceptually. The definition adds the names that the body will use for those inputs, without changing the overall shape very much.

There is less mental conversion between "syntax for defining a function" and "syntax for describing a function's type."

## Underneath that shape is ordinary currying

This works because Seseragi functions are curried.

Function arrows associate to the right, so:

```rust
Int -> Int -> Int
```

means:

```rust
Int -> (Int -> Int)
```

Give the function one `Int` and what remains is:

```rust
Int -> Int
```

Give that function another `Int`, and the result is an `Int`.

Function application follows the same structure:

```rust
add 1 2
```

is applied from the left:

```rust
(add 1) 2
```

Each argument advances through one arrow in the function type.

Seseragi's Tour treats this "multiple arguments become a sequence of one-argument function values" behavior directly as currying.

So currying is not an optional trick added after the function syntax was designed.

**The definition is already describing a curried function in a shape close to its type.**

That is the more accurate model.

## Once I see it that way, parameter-list parentheses stop feeling necessary

TypeScript naturally writes:

```ts
function add(a: number, b: number): number {
  return a + b
}
```

Rust naturally writes:

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

In both languages, `(a, b)` is a parameter list treated visually as one unit.

Those syntaxes make perfect sense for those languages.

But the thing I want to remain visible in Seseragi is this continuous function type:

```rust
Int -> Int -> Int
```

If I add parameter-list parentheses, the surface begins to suggest "one grouped input containing two values."

But the actual Seseragi type is:

```rust
Int -> (Int -> Int)
```

So I don't really think of the parentheses as something I removed to make the syntax shorter.

**I brought the shape of the function type into the definition, and then there was no obvious job left for parameter-list parentheses.**

Reducing punctuation was not the starting goal.

## Tuples make the distinction much clearer

Compare these two types:

```rust
Int -> Int -> Int
```

and:

```rust
(Int, Int) -> Int
```

They are different.

The first is a curried function. It accepts one `Int` and returns another function of type `Int -> Int`.

The second accepts **one Tuple value**, `(Int, Int)`, and returns an `Int`.

In Seseragi, `()` and `,` already carry real Tuple meaning.

If `(a, b)` were also used merely as punctuation around two independent parameters, those two models would start looking more alike than they really are.

The current `fn` syntax declares parameters by name and type; it does not directly place a Tuple pattern in the parameter position.

But the important point here is not which pattern feature exists today.

It's the model:

**`Int -> Int -> Int` and `(Int, Int) -> Int` are different types, and I want their definitions to look different too.**

It's not that Seseragi refuses parentheses.

It's that parentheses already mean something.

## Requiring a return type follows the same idea

Ordinary Seseragi `fn` definitions require an explicit return type.

So this is not valid:

```rust
fn add a: Int -> b: Int =
  a + b
```

A compiler could probably infer that the body returns `Int`.

But if the final `-> Int` disappears, the visible function type in the definition becomes incomplete.

With:

```rust
fn add a: Int -> b: Int -> Int =
  a + b
```

removing the names still leaves:

```rust
Int -> Int -> Int
```

The language also has practical reasons for keeping ordinary function return types explicit: module APIs and recursive functions benefit from a stable declared contract.

But aesthetically, I like another consequence:

**information can be inferable to the compiler and still be useful enough to keep in source for the human reader.**

Removing parentheses does not remove information about the function type.

Removing the return type does.

Shorter source is not automatically better source.

## A "two-argument function" still advances one input at a time

In conversation, I will happily call `add` a two-argument function.

That's convenient language and nobody gets hurt.

But the type still tells a more precise story:

```rust
Int -> Int -> Int
```

Apply one `Int` and you have:

```rust
Int -> Int
```

So this is natural:

```rust
let increment = add 1
```

There is no special partial-application construct here.

Application simply moved through the first arrow and stopped.

What I find interesting about partial application isn't only that Seseragi supports it.

It's that **you can almost predict the behavior directly from the way the function definition is written**.

## A function with no visible parameters still returns to the same model

Seseragi can write a function that receives no meaningful information like this:

```rust
fn heading -> String =
  "Hello"
```

There is no visible parameter.

Semantically, though, the function has the shape:

```rust
Unit -> String
```

Conceptually, you can imagine starting from:

```rust
fn heading unit: Unit -> String =
```

and omitting the name `unit` because naming a `Unit` input adds no useful information.

Calling it is:

```rust
heading ()
```

There is no separate zero-argument call syntax such as `heading()`.

Again, the model returns to an ordinary `A -> B` function type.

## `effect fn` has a compact form for a different reason

Ordinary `fn` keeps its return type explicit, but `effect fn` has a compact form:

```rust
pub effect fn main =
  println "Hello"
```

At first glance, that seems to contradict everything above.

But writing `effect fn` already tells the reader that this function does not return an ordinary value directly. Its larger shape is:

```rust
Effect<R, E, A>
```

From there, `R` can be inferred from the effects used by the body, and `A` from the successful result.

`E` is inferred too, although application code often transforms failures into a domain error explicitly with things such as `mapError`, so failure design still tends to appear in source.

When an explicit contract matters, the longer form is available:

```rust
effect fn greet name: String -> Unit
with Console
fails ConsoleError =
  println $ `hello ${name}`
```

So the compact `effect fn` form is not saying "type information doesn't matter here."

**The large fact that this function returns Effect is already present in the `effect fn` definition itself.**

The remaining question is how much of `R / E / A` needs to be written explicitly at that point.

## Haskell puts two lines next to each other; Seseragi makes them overlap

Haskell can write:

```haskell
add :: Int -> Int -> Int
add a b = a + b
```

The function type and definition are separate, and both are very direct.

Seseragi writes:

```rust
fn add a: Int -> b: Int -> Int =
  a + b
```

The result looks almost like those two Haskell lines have been overlaid.

Take only the types:

```rust
Int -> Int -> Int
```

Take only the names:

```rust
add a b
```

I didn't begin with a plan to import Haskell's syntax.

But once you try to define curried functions while keeping the function type visually close to the definition, it's interesting that the designs end up near some of the same territory.

## In the end, this is the line I like

```rust
fn add a: Int -> b: Int -> Int =
  a + b
```

The important part isn't simply that there are fewer parentheses.

It isn't simply that partial application works.

Those things follow naturally from the same model.

The part I like most is that if I remove the parameter names, I get:

```rust
Int -> Int -> Int
```

almost unchanged.

Start with a curried function type.

Give its inputs names:

```rust
a: Int -> b: Int -> Int
```

Then add the function name and body:

```rust
fn add a: Int -> b: Int -> Int =
  a + b
```

**Look at the function definition, and the function type is already there.**

That has become one of my favorite small design choices in Seseragi.

https://seseragi.vercel.app/