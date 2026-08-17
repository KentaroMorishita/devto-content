---
title: "Tuples Are Weirdly Useful for Something So Small"
published: false
tags: programming, types, functional, seseragi
description: "Sometimes I just want to carry two values together without inventing a name for the pair. That tiny convenience ended up touching patterns, product types, and type-class instances."
series:
main_image:
canonical_url:
---

When you build a programming language, the grand features are not always the ones you need first.

Sometimes the requirement is much less impressive:

**I just want to put two values together.**

For example:

```rust
("Osaka", 2)
```

A city name and a number of stops.

That is not necessarily a domain concept important enough to deserve a named type.

It is just two values I want to carry around together.

That is where tuples keep being annoyingly useful.

## A pair that does not deserve a name

In Seseragi, I can write:

```rust
let route: (String, Int) = ("Osaka", 2)
```

The type is exactly what it looks like:

```text
(String, Int)
```

There are no field names like a Record.

There is no nominal type name like a Struct.

It is simply a value containing a `String` and an `Int` in that order.

That is useful for small return values too:

```rust
fn routeInfo city: String
  -> stops: Int
  -> (String, Int) =
  (city, stops)
```

If I ask, "Does this pair itself have an important domain name?" the answer is often no.

So creating a new named structure would add more meaning than the code actually has.

A tuple is almost aggressively modest.

That is exactly why it works.

## Languages solve "return two things" in very different ways

Python makes tuples feel completely ordinary:

```python
route = ("Osaka", 2)
city, stops = route
```

Returning several values through a tuple is everyday code.

Rust also treats tuples as straightforward product values:

```rust
let route: (String, i32) = ("Osaka".into(), 2);
```

Haskell has tuples everywhere too.

TypeScript has tuple types:

```ts
const route: [string, number] = ["Osaka", 2]
```

although at JavaScript runtime that representation is still an Array.

Go gives a particularly interesting alternative.

It does not need a first-class tuple type for the common "return two values" case because functions can directly return multiple values:

```go
func routeInfo() (string, int) {
    return "Osaka", 2
}
```

That is a very clean answer if the main problem is function return values.

Seseragi went another direction because I wanted the pair to remain an ordinary value after the function returns.

I wanted to store it, pass it around, pattern-match it, and use product values in ordinary composition.

So instead of adding a special "multiple return values" world, I kept the tuple itself as a value.

That difference is more interesting to me than syntax alone.

## Lightweight does not mean untyped

A tuple is convenient because it is lightweight.

But the type is still precise.

These are not the same type:

```text
(String, Int)
```

and:

```text
(Int, String)
```

Order is part of the type.

So a tuple is not really an "anything bag."

I think of it more as:

**a small anonymous structure.**

That puts it in a nice middle position.

An `Array` usually says all elements have the same element type.

A `Record` gives parts names.

A `Struct` gives the whole thing a domain identity.

A tuple says:

```text
These values belong together for now.
That is all the meaning I need.
```

## Pattern matching is where tuples become much nicer

A tuple by itself is just values sitting next to each other.

The feature becomes much more useful once I can unpack it with the same pattern machinery used elsewhere in the language.

```rust
let route: (String, Int) = ("Osaka", 2)
let (city, stops) = route
```

The shape of the value is:

```text
(String, Int)
```

and the shape of the binding is:

```text
(city, stops)
```

That feels natural to me.

Python unpacking and TypeScript array destructuring look similar on the surface, but the thing I care about in Seseragi is that tuple binding is not a completely separate destructuring subsystem.

It is part of the same broader pattern mechanism used by `match` and other structured values.

That kind of reuse keeps paying off.

I would much rather have one idea called "pattern" appear in several places than invent a tuple-specific extraction API and another matching rule somewhere else.

## Tuple, Record, and Struct are not competing for the same job

I did wonder whether tuples were unnecessary once Seseragi had Records and Structs.

Why not just write a Record every time?

Something like:

```text
{ city: String, stops: Int }
```

That is often better, especially in application code where field names make later changes safer and easier to read.

I use that style all the time in TypeScript.

But I ended up with a useful rough distinction:

```text
I just need to group a few values
        -> Tuple

The parts need names
        -> Record

The whole thing has domain identity
        -> Struct
```

It is not a hard rule.

Two values do not automatically mean tuple.

Sometimes:

```ts
return { city, stops }
```

is much clearer than a pair.

The important question is how much meaning I want the structure to carry.

A tuple is the lightest option.

That is why it works so well for intermediate values and tiny return types.

## Making tuples first-class creates more work than the syntax suggests

This is the part I did not fully appreciate at first.

If tuples are ordinary values and ordinary types, then they eventually need to participate in the same language capabilities as everything else.

How should they be displayed?

How should debugging show nested tuples?

What happens with equality?

How is type-class evidence composed from the element types?

Seseragi has compiler-provided `Show` / `Debug` support for tuples and structural records so users do not need to manually declare an instance for every anonymous product value.

That work was tracked here:

https://github.com/KentaroMorishita/seseragi/issues/135

The issue is already complete, and its requirements are much larger than the syntax `(a, b)` makes you expect.

It includes recursive display of nested values, stable field ordering for records, and compiler-provided instance evidence.

From the user's side:

```rust
("Osaka", 2)
```

is an almost comically small language feature.

From the compiler side, deciding that this is a **real type like the others** means it cannot become a second-class citizen the moment tooling or type classes show up.

That gap between tiny surface and wide implementation impact is something I keep running into.

## Product types also show up in composition

There is another reason I wanted tuples to be ordinary values rather than a special return mechanism.

Seseragi uses ordinary product values in places where several independent computations are combined.

A pair is a very simple way to say:

```text
I have A
I have B
I want (A, B)
```

That matters when talking about Applicative-style composition later.

I do not need a dedicated multi-return rule for that.

I need a constructor for an ordinary product value.

That makes tuples useful far beyond "my function wants to return two things."

The syntax stays small, but the value participates in the rest of the language normally.

## Try making the type disagree in the Playground

The smallest sample looks like this:

```rust
let route: (String, Int) = ("Osaka", 2)

pub effect fn main =
  println "route: (Osaka, 2)"
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Change the type to:

```rust
(String, Bool)
```

and leave the value unchanged.

Even though tuples are lightweight, the type checker still sees a real structural mismatch.

That is the balance I ended up liking.

The value is cheap to create.

The structure is anonymous.

But the type is not vague.

**A tuple is not a sloppy value. It is a typed structure with deliberately minimal meaning.**

Sometimes I do not want to design another domain abstraction.

Sometimes I really do just want to carry two values together.

It turns out that tiny requirement is enough to justify a surprisingly useful feature.