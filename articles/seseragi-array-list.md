---
title: "Do I Really Need Both Array and List?"
published: false
tags: programming, datastructures, types, seseragi
description: "Seseragi has both Array and List even though they look almost interchangeable at first. Building them made me realize that one collection abstraction does not mean one concrete data structure."
series:
main_image:
canonical_url:
---

Seseragi has both `Array` and `List`.

At first glance, that can look a little redundant.

```rust
let array: Array<Int> = [10, 20, 30]
let list: List<Int> = `[10, 20, 30]
```

Both hold multiple values.

Both are immutable.

So the obvious question is:

**Why not just have one?**

I asked myself the same thing.

## They hold multiple values, but they do not have the same shape

In Seseragi, the distinction is not meant to be cosmetic.

Conceptually:

```text
Array<A> = immutable contiguous sequence
List<A>  = immutable linked list
```

That means the operations that feel natural on them are not identical.

A `List`, for example, naturally fits a head-and-tail view:

```rust
fn describe values: List<Int> -> String = match values {
  `[] -> "empty"
  `[head, ...tail] -> `head: ${head} / tail: ${tail}`
}
```

An `Array` naturally leans toward random access and contiguous data.

If I only look at the phrase "a collection of values," they seem like the same thing.

If I look at how the data is structured and how I want to use it, they stop being interchangeable pretty quickly.

That was the first useful distinction for me:

**One collection abstraction does not imply one concrete collection type.**

## Web languages trained me to expect one obvious sequence type

Most of my programming background is Web development, so I am very used to languages where there is one obvious sequence type for everyday work.

In TypeScript:

```ts
const values = [10, 20, 30]
```

In Python:

```python
values = [10, 20, 30]
```

In Go, slices fill a similar everyday role.

For a huge amount of application code, that is enough.

So when I started building Seseragi, "maybe `Array` alone is enough" felt completely reasonable.

Then I looked at the other side.

Haskell makes linked lists feel almost like part of the language's personality:

```haskell
1 : 2 : 3 : []
```

Prepend one value, split into head and tail, recurse over the structure. The representation naturally affects how you think about the data.

Rust gives a different answer. `Vec<T>` and `LinkedList<T>` are plainly different data structures with different characteristics.

Seseragi did not copy either answer directly.

What I wanted was closer to:

```text
the ordinary convenience of an array-like sequence
+
a real recursive List structure
```

Once I phrased it that way, keeping both stopped feeling wasteful.

## Different types do not need different names for every operation

This was the next part I found interesting.

If `Array` and `List` are different types, that does **not** mean every API should have unrelated names.

If an operation means the same thing, I want to write the same thing.

```rust
map double array
map double list
```

Likewise for operations such as `filter` where the semantic idea is shared.

The current standard module registry reflects that direction: `std/array` and `std/list` both go through the same collection-interface construction for their shared public surface.

That is a small implementation detail, but it matches the design line I ended up liking:

**Keep the data structures distinct. Share the capabilities that really are the same.**

This sits somewhere between two instincts I already knew.

Haskell makes common operations feel very natural through abstractions such as `Functor` and type classes.

Languages like Go tend to keep the concrete data structure and its operational properties very visible.

I found myself wanting both ideas at once.

## The API is not finished just because the types exist

There is another very Seseragi part of this story: the surface is still incomplete.

`Array` and `List` already exist and a useful set of collection functions is wired up. The current implementation has operations such as `filter`, `filterMap`, `flatMap`, `find`, `take`, `drop`, and `append` connected.

But the specification contains more.

There is still an open implementation-gap issue for operations including:

```text
reduceRight
findIndex
takeWhile
dropWhile
zip
zipWith
unzip
sort
sortBy
groupBy
last
init
chunksOf
windows
```

and the related `SizeError` contract.

https://github.com/KentaroMorishita/seseragi/issues/300

So this is not an "Array/List complete API guide."

It is much more about why I kept both types and what that decision forces me to care about.

## Sharing a function name does not erase evaluation semantics

This became more obvious while writing the completion criteria for that issue.

It is easy to think of a standard-library function as complete once the function exists.

But `sort` is not just "there is a function named sort."

`groupBy` is not just "there is a function named groupBy."

The behavior matters:

- Does an operation short-circuit when the result is known?
- Is the sort stable?
- How many times is a callback evaluated?
- In what order are groups produced?
- What are the complexity guarantees for `Array` versus `List`?

These details are part of the language surface too.

That changed how I look at standard libraries.

Before building a language, I mostly consumed APIs.

Now I keep running into a more annoying question:

```text
The function exists.

Okay, but what exactly are you promising?
```

That promise is different from the name of the function.

Two collection types can both support `map` without pretending that their underlying structure is the same.

## And yes, I somehow made a List without wiring up cons

There is an even funnier current gap.

The Seseragi specification defines `:` as the List cons operator.

```rust
1 : 2 : 3 : `[]
```

It is supposed to be right-associative and prepend in constant time to the persistent linked list.

Except the current compiler still does not have that surface wired through.

https://github.com/KentaroMorishita/seseragi/issues/298

So I managed to build a language with a linked `List` and then leave the cons operator disconnected.

How do you forget **that** part of a linked list? 😄

The funny thing is that the omission became useful in its own way. It forced me to look again at operators, surface syntax, and whether a custom operator could approximate the missing feel.

One implementation gap turned into another language-design question.

This keeps happening.

## Array and List should feel different where the difference matters

The distinction also shows up in syntax.

An `Array` has random access as part of its intended surface.

A `List` does not.

I do not want to add `list[5]` merely because it would be convenient to type. A linked list can of course walk to its fifth element, but writing it with the exact same surface as array indexing makes the operational difference easier to forget.

That is one of the tradeoffs I am increasingly comfortable with in Seseragi:

**Do not erase a meaningful difference merely to make two types look uniform.**

Uniformity is nice when the meaning is genuinely shared.

It is misleading when the same notation hides very different structure.

## You can try both in the Playground

The smallest examples are almost boring.

Array:

```rust
let values: Array<Int> = [10, 20, 30]

pub effect fn main =
  println $ `Array: ${values}`
```

List:

```rust
let values: List<Int> = `[1, 2, 3]

pub effect fn main =
  println $ `List: ${values}`
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

At that level they really do look similar.

The reason to keep both only becomes obvious when I start asking what comes next:

How do I decompose the value?

Do I want random access?

What does prepend cost?

What operations can be shared honestly?

What operational differences should remain visible?

That was the useful realization for me.

**"Contains multiple values" is a shared property. It is not enough reason to make two different data structures the same type.**