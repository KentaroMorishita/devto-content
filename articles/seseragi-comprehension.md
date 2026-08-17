---
title: "I Didn't Want Another for Loop. I Wanted the Values."
published: false
tags: programming, functional, collections, seseragi
description: "Sometimes I don't want to describe the loop. I want to describe the collection that should exist when I'm done."
series:
main_image:
canonical_url:
---

Suppose I want the squares of the even numbers from 1 through 4.

TypeScript can do this without any trouble:

```ts
const values: number[] = []

for (let value = 1; value <= 4; value++) {
  if (value % 2 === 0) {
    values.push(value * value)
  }
}
```

This is perfectly normal code.

But when I read it, the thing I wanted and the thing the code talks about are slightly different.

What I wanted was:

**the squares of the even values from 1 through 4**

What I wrote was:

**create an empty array, loop, test a condition, and push**

That gap is small, but I keep noticing gaps like this while building Seseragi.

The code works. The question is whether the structure of the code puts the thing I care about in the center.

## In Seseragi, I can describe the collection directly

Seseragi has comprehension syntax:

```rust
let values = [
  value * value
  | value <- 1 ..= 4,
    value % 2 == 0
]
```

The way I read it is almost literal:

```text
collect value * value
where value comes from 1 ..= 4
and value is even
```

The focus is no longer the procedure that mutates a collection.

The focus is the **collection I want to exist**.

For a small example, the one-line form is even clearer:

```rust
let values = [value * value | value <- 1 ..= 4, value % 2 == 0]

pub effect fn main =
  println $ `values: ${values}`
```

I like that because the whole expression answers one question: what are `values`?

## It looks Haskell-like, but Python gives the same feeling

The surface syntax is obviously close to Haskell:

```haskell
[value * value | value <- [1..4], even value]
```

Haskell list comprehensions have been around forever.

Python's version looks different but has a similar feel:

```python
values = [
    value * value
    for value in range(1, 5)
    if value % 2 == 0
]
```

In both cases, I am much closer to describing the final values than to narrating how an array gets populated.

That feeling mattered more to me than reproducing a particular language's syntax.

And of course TypeScript can already move in the same declarative direction:

```ts
const values = [1, 2, 3, 4]
  .filter(value => value % 2 === 0)
  .map(value => value * value)
```

Rust can do the same with iterator chains:

```rust
let values: Vec<_> = (1..=4)
    .filter(|value| value % 2 == 0)
    .map(|value| value * value)
    .collect();
```

So this is not an argument that languages without comprehension syntax are somehow procedural or inferior.

The interesting difference is smaller:

**For the same desire, do you compose functions in a chain, or do you give the language an expression form that reads like a description of the result?**

Seseragi supports `map`, `filter`, and pipelines too.

I still wanted comprehensions.

Not because one style replaces the others, but because sometimes I want the generation rule to read as one object.

## I am not trying to eliminate `for`

This point matters because I have already spent time joking about trying to get rid of `if`.

I am not doing the same thing to `for`.

Seseragi has an effectful `for`, and it is useful precisely when I want to do something effectful for each value.

For example:

```rust
pub effect fn main = for number <- 1 ..= 30 {
  println $ fizzBuzz number
}
```

Here I do not want a collection.

I want thirty effects to happen in sequence.

That is a different meaning.

Compare it with:

```rust
[value * value | value <- 1 ..= 4, value % 2 == 0]
```

This expression exists to produce a value.

Both involve repetition.

But **"repeat effects" and "construct a collection" are not the same operation just because both walk through inputs.**

I would rather let that difference remain visible in the source.

Python has both `for` statements and comprehensions too. In Seseragi, the distinction also lines up with the language's effect model: one form is about effects, the other is a pure collection expression.

Reducing the number of syntactic forms is not always the same thing as reducing conceptual complexity.

Sometimes two forms make the semantic difference easier to see.

## Ranges make the syntax click

One reason I enjoy the comprehension syntax in Seseragi is that ranges are ordinary values.

```rust
1 ..= 4
```

That is a `Range<Int>`.

The generator simply consumes it:

```rust
value <- 1 ..= 4
```

Then I add a condition:

```rust
value % 2 == 0
```

And the produced value:

```rust
value * value
```

Put the pieces together and the expression almost reads like a specification of the collection.

I like moments where small features combine this way.

No special "comprehension range" was needed.

No special API was needed for "even squares from an inclusive integer range."

The range feature, pattern binding, filtering condition, and collection expression simply meet each other.

That kind of composition is usually more satisfying to me than adding another dedicated API.

## Then `<-` turned a small syntax feature into a pattern-semantics problem

At first this part looks simple:

```rust
value <- source
```

You could imagine implementing it as "take an item from the source and give it a name."

But once the rest of the language has patterns, that becomes an awkward special case.

Seseragi uses patterns in `match`.

It uses patterns in `let` bindings.

There are bindings inside Effect `do` and Monad `do`.

There are comprehensions.

There is effectful `for`.

If all of these mean "take a value and bind according to this shape," having a different typing and scope rule for every surface becomes a mess.

I discovered exactly that mess while writing ordinary examples.

A nested pattern such as:

```rust
match result {
  Just (User (name, age)) ->
    `${name}: ${age}`
}
```

failed through one path.

A typed `let` inside `do` failed through another.

The tempting fix would have been to patch the specific `Maybe` case I happened to hit.

That would have been the wrong fix.

The problem was bigger: the language claimed to have one idea called pattern binding, but different surfaces were secretly taking different compiler paths.

That became Issue #194:

https://github.com/KentaroMorishita/seseragi/issues/194

The issue explicitly covered top-level `let`, blocks, Effect `do`, Monad `do`, `<-`, `match`, comprehensions, and effectful `for`, across tuple, record, struct, collection, constructor, and generic ADT patterns.

In other words, a small piece of comprehension sugar dragged me into compiler architecture.

That is very normal when building a language, apparently.

## The regression was fixed, but the interesting part was what it revealed

Issue #194 has since been closed as completed.

The fix unified typed `do let` with the common pattern-binding path, added grouped parenthesized patterns, and verified nested patterns across `Maybe`, partial `Either`, and imported user-defined generic ADTs instead of special-casing a standard type.

The completion note even pinned actual execution in both CLI-like and Playground/WASM paths.

That is good.

But the part I find more interesting is how the problem was discovered.

I was not stress-testing the pattern subsystem.

I was trying to write a normal Applicative example.

A feature that looked local — comprehension binding — exposed that the compiler's notion of "bind this shape" was not actually as unified as the language's surface suggested.

That is one of the recurring themes of Seseragi development:

**Small syntax is only cheap if the semantics underneath it are genuinely shared.**

Otherwise every convenience feature becomes another tunnel through the compiler.

## `map` and `filter` are still useful

I do not think comprehensions are always the clearest answer.

If I only want to transform values, `map` may be easier to read.

If I only want to select values, `filter` may be perfect.

If the transformations form a sequence, a pipeline can be clearer than one large comprehension.

The goal is not to establish one blessed style.

What I wanted was the ability to choose what the source should emphasize.

Am I describing **a sequence of transformations**?

Or am I describing **the set of values I want to construct**?

For the second case, a comprehension often feels extremely direct.

## The Tour teaches it only after the collection basics

The Seseragi Tour introduces Array, List, and Range before building toward `map`, `filter`, folds, pipelines, and comprehensions.

That work was tracked here:

https://github.com/KentaroMorishita/seseragi/issues/175

I like that order.

"The language has comprehension syntax" is not very useful information by itself.

It makes more sense after you already know what values can feed it and what ordinary collection functions can do.

Then the comprehension becomes another reading of an idea you already understand.

## Try changing the description instead of the loop

You can paste this into the Playground:

```rust
let values = [value * value | value <- 1 ..= 4, value % 2 == 0]

pub effect fn main =
  println $ `values: ${values}`
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Now widen the range:

```rust
1 ..= 10
```

Change even to odd:

```rust
value % 2 != 0
```

Or replace the square with a template.

What I like is the feeling of the edit.

I am not changing loop control.

I am changing the **description of the values I want**.

That is all I was after.

I never really hated `for` loops.

I just did not want to write a procedure when the thing I cared about was a value.