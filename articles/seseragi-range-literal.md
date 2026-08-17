---
title: "The Tiny Difference Between .. and ..= Matters More Than It Looks"
published: false
tags: programming, syntax, rust, seseragi
description: "HKT and effects are exciting, but the syntax I notice every day might be one extra '=' in a range."
series:
main_image:
canonical_url:
---

When you are building a programming language, it is easy to get excited about the large features.

Higher-kinded types. Effects. Type classes. Compiler IRs.

Those are the things that make a language feel ambitious.

But the syntax I actually notice every day is often much smaller.

For example:

```rust
1 .. 10
1 ..= 10
```

The difference is one character.

The first range excludes the end. The second includes it.

That is not a groundbreaking feature.

It is also something I use constantly.

## One character removes a tiny translation from my head

In Seseragi:

```rust
1 .. 4
```

means 1, 2, 3.

And:

```rust
1 ..= 4
```

means 1, 2, 3, 4.

The Tour sample is almost embarrassingly simple:

```rust
let exclusive: Range<Int> = 1 .. 4
let inclusive: Range<Int> = 1 ..= 4
```

That is the whole idea.

But without an explicit inclusive form, I end up doing a tiny conversion every time I read a loop boundary:

```text
Does this stop before 10?
Does it include 10?
Was that <= or <?
```

With the range itself carrying that information, I can read the thing I mean directly.

It is a very small reduction in mental work.

Programming languages are full of very small reductions in mental work.

## Yes, this looks a lot like Rust

If you know Rust, this syntax is familiar:

```rust
1..4
1..=4
```

Rust also treats ranges as values rather than as syntax that only exists inside a `for` loop.

That combination felt good in Seseragi too:

- show inclusive vs exclusive directly in the syntax
- keep the range as an ordinary value

But the story was not, "I want to copy Rust's range syntax."

The annoyance came first.

I did not want to repeatedly translate:

```text
i < 10
```

and:

```text
i <= 10
```

into a mental picture of the values being traversed.

Once I started asking what I wanted to see instead, `..` and `..=` felt natural.

Then I looked at Rust and thought: yeah, of course someone else landed here too.

I like this kind of convergence more than syntax comparison for its own sake.

Sometimes two languages look similar because one borrowed from the other.

Sometimes they look similar because the same problem has a surprisingly satisfying shape.

## Python and Go answer the same question differently

Python's `range` excludes the end:

```python
range(1, 4)
```

produces 1, 2, 3.

If you want 4 too, you write:

```python
range(1, 5)
```

That fits very naturally with indexing and slicing once you are used to it.

Go often keeps the condition explicit instead:

```go
for i := 1; i < 4; i++ {
    // ...
}
```

There is a nice property to that too. The boundary rule is right there in the condition.

Neither approach is a problem.

Seseragi simply made a different tradeoff: instead of making the loop condition the primary thing, make the **range itself** the primary thing.

```rust
let numbers: Range<Int> = 1 ..= 4
```

Now the same value can be consumed in several places.

That decision matters more to me than whether the punctuation resembles Rust.

## Haskell's enumeration looks similar, but the value is different

Haskell can write:

```haskell
[1..4]
```

which produces a list from 1 through 4.

It is wonderfully compact.

But in Seseragi, I did not want the syntax to mean "construct this collection."

I wanted it to mean:

```text
the range from here to there
```

So its type is:

```text
Range<Int>
```

not `Array<Int>` or `List<Int>`.

A loop can consume that range.

A comprehension can consume that range.

Other operations can consume that range later.

The range does not need to pretend it is already a collection.

That separation became more important as Seseragi grew.

## A range is not `for` syntax

This was one of the small design choices that ended up fitting the rest of the language nicely.

`1 ..= 4` does not only exist inside a loop.

It is a value:

```rust
let numbers: Range<Int> = 1 ..= 4
```

Then an effectful `for` can consume it:

```rust
pub effect fn main = for number <- 1 ..= 4 {
  println `${number}`
}
```

A collection comprehension can consume the same kind of value:

```rust
let values = [
  value * value
  | value <- 1 ..= 4,
    value % 2 == 0
]
```

The range itself does not need separate versions for each consumer.

There is no "loop range" and "comprehension range."

There is just a `Range<Int>`.

That is the part I like.

Seseragi keeps ending up with this pattern:

**If two places mean the same value, I would rather reuse the value than invent two pieces of syntax that happen to look alike.**

## The same range can describe effects or values

This is where the tiny syntax starts connecting to larger design choices.

If I want to perform an effect for every number:

```rust
for number <- 1 ..= 4 {
  println `${number}`
}
```

If I want to construct values:

```rust
[number * 2 | number <- 1 ..= 4]
```

The surrounding expression tells me what kind of computation I am doing.

The range does not.

That is useful because "iterate over 1 through 4" and "produce a collection from 1 through 4" are not actually the same operation.

They only share an input shape.

I would rather separate the meanings while keeping the common value reusable.

That sounds like a very abstract design principle when written down.

In code, it is just:

```rust
1 ..= 4
```

which is much nicer.

## Why not use named functions instead?

I could have written an API like:

```text
range 1 4
rangeInclusive 1 4
```

That would be perfectly explicit.

And I do like named functions when a relationship is uncommon or subtle.

But ranges are everywhere.

For very frequent, visually simple relationships, punctuation can be faster to read than a longer name.

```rust
1 .. 4
1 ..= 4
```

I can scan those and see the boundary difference immediately.

Seseragi keeps a few operators for the same reason. `$` and `|>` are not there because I want as many operators as possible. They are there because some relationships happen often enough that the visual shape earns its place.

I do not think "named functions are always clearer" or "operators are always cleaner" is a useful rule.

Frequency matters.

Visual recognition matters.

And sometimes one character is exactly enough information.

## The Tour made me appreciate how small this feature really is

The current Seseragi Tour teaches ranges alongside Array and List, then gradually builds toward mapping, filtering, folding, and comprehensions.

The collection Tour work was tracked in this issue:

https://github.com/KentaroMorishita/seseragi/issues/175

What I like about that sequence is that `Range` does not need a long theory section.

You can show:

```rust
1 .. 4
1 ..= 4
```

change one character, run it, and immediately understand the difference.

Then later that same value appears inside other features.

That is a much better life for a language feature than needing a paragraph every time it appears.

## Try deleting the `=`

This is probably the easiest Seseragi experiment possible.

Start with:

```rust
pub effect fn main = for number <- 1 ..= 4 {
  println `${number}`
}
```

You get 1 through 4.

Now delete one character:

```rust
pub effect fn main = for number <- 1 .. 4 {
  println `${number}`
}
```

Now 4 disappears.

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

That is all.

No new abstraction. No new type-system trick. No clever compiler architecture story.

Just one character that lets the source say exactly where the range ends.

I still get more excited when a big feature finally works.

But if I count how often I benefit from each feature while actually writing code, `..=` might beat a lot of the fancy ones.

**A language's daily feel is probably built from hundreds of tiny translations you no longer have to do.**