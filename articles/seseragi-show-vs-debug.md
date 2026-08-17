---
title: "Show and Debug Both Return Strings. I Still Wanted Both."
published: false
tags: programming, types, debugging, seseragi
description: "A user-facing string and a developer-facing representation are both text, but they do not carry the same intent."
series:
main_image:
canonical_url:
---

There are a lot of reasons to turn a value into text.

Display it in a UI.

Put it in a log.

Inspect it while debugging.

Print it from a Playground.

At first, all of those sound like the same feature:

> Convert the value to a String.

The longer I worked on Seseragi, the less comfortable I became with that sentence.

## The person reading the string changes what the string should mean

Suppose I have:

```rust
type Badge =
  | Active
  | Paused
```

For a user-facing label, this may be perfect:

```text
active
paused
```

For debugging, I may want something closer to:

```text
Badge.Active
Badge.Paused
```

Same value.

Same result type: `String`.

Different purpose.

So Seseragi keeps two capabilities:

```rust
instance Show<Badge> {
  fn show value: Badge -> String =
    match value {
      Active -> "active"
      Paused -> "paused"
    }
}

instance Debug<Badge> {
  fn debug value: Badge -> String =
    match value {
      Active -> "Badge.Active"
      Paused -> "Badge.Paused"
    }
}
```

The distinction I want is simple:

```text
Show  -> representation intended for users
Debug -> representation intended for inspecting program values
```

It is not a huge type-system breakthrough.

It is one of those small distinctions that gets more useful the larger the language becomes.

## Rust's `Display` and `Debug` make this split easy to appreciate

Rust has a very visible version of the same idea:

```rust
println!("{}", value);   // Display
println!("{:?}", value); // Debug
```

And `Debug` is commonly derived:

```rust
#[derive(Debug)]
```

I like the honesty of that split.

A nice user-facing representation is not necessarily the best representation for someone trying to understand the structure of a value.

Seseragi does not try to copy Rust's entire formatting system, but this distinction fit naturally into the trait/instance model that already existed.

`Show<A>` and `Debug<A>` are just two different capabilities.

## Python has been telling us the same thing with `str` and `repr`

Python also distinguishes:

```python
str(value)
repr(value)
```

The convention is not identical to Seseragi's contract, but the recurring idea is recognizable.

One representation is usually aimed at human-facing readability.

The other is more concerned with revealing the value as a program object.

After using enough languages, you keep seeing this split reappear.

That made me less interested in forcing everything through one universal `toString`-like operation.

## There are good reasons to keep only one too

Go's `fmt.Stringer` is deliberately small:

```go
String() string
```

Many values need nothing more.

The formatting package can still inspect values in other ways.

PHP has `__toString()`.

JavaScript and TypeScript often get extremely far with `toString()` plus object inspection in developer tools:

```ts
console.log(value)
```

That is wonderfully convenient.

So this is not a claim that two string-conversion capabilities are always superior.

Seseragi keeps both because I wanted the **intent** to survive at the call site.

If I write:

```rust
show value
```

I am making a different promise from:

```rust
debug value
```

The result type alone cannot express that difference.

The operation name can.

## The distinction becomes more important once values have structure

Primitive values are the easy part.

A language also needs to display:

- Array
- List
- Maybe
- Either
- Range
- Tuple
- Record
- Struct
- ADT
- Newtype

Then the question becomes recursive.

If I have:

```rust
(Int, String)
```

what should `Show` do?

What should `Debug` do?

If I have a structural Record:

```rust
{ zeta?: String, alpha: Int }
```

how stable should field order be?

How are Strings quoted and escaped in Debug output?

What happens for nested values?

A tiny "convert to String" feature starts turning into a language-wide rendering contract.

## Seseragi actually spent an entire Epic on this boring-looking problem

The work is tracked under:

https://github.com/KentaroMorishita/seseragi/issues/103

That Epic is completed now.

It covered primitive instances, Array/List/Maybe/Either, Range, Tuple, structural Records, nominal deriving, Playground integration, and the surrounding inference/runtime gaps required to make those surfaces work consistently.

The core contract explicitly says:

- Show is user-facing
- Debug is developer-facing
- host `toString` and `JSON.stringify` do not define Seseragi semantics
- String escaping and constructor/field names should be stable
- Range should be shown as a range rather than expanded into every element
- types that intentionally have no Show/Debug instance should fail clearly

That is a lot of machinery for two functions returning `String`.

## Generic code is where these become real type-class capabilities

Suppose I want:

```rust
pub fn showGeneric<A>
  value: (A, { item: A })
  -> String
where Show<A> =
  show value
```

This function has no idea whether `A` is Int, String, UserId, or something imported from another module.

It knows only:

```text
Show<A> is available.
```

If Tuple and Record Show instances are structural, their evidence can be built recursively from the evidence for the values inside them.

Suddenly a mundane feature becomes a stress test for the generic evidence system.

Can the compiler prove that every nested component is showable?

Can it combine the evidence correctly?

Can that evidence survive a module boundary?

Display code is surprisingly good at finding type-system holes because it touches everything.

## I did not want Debug to mean "whatever JavaScript happens to print"

Seseragi currently targets TypeScript/JavaScript as a backend.

That makes this temptation very strong:

```ts
console.log(value)
```

The host already has excellent object inspection.

Why not just use it?

Because then Seseragi's visible value representation becomes coupled to the backend's internal object representation.

An ADT might be encoded one way today and another way after a compiler refactor.

A Maybe might have a JavaScript object shape that exists purely for runtime convenience.

A Range absolutely should not need to materialize every value just to be inspectable.

I want:

```text
Seseragi value
  -> canonical Seseragi debug representation
```

not:

```text
Seseragi value
  -> whatever internal JS object the current backend emits
  -> host inspection decides the public text
```

That boundary becomes more important precisely because the backend is so convenient.

## Debug is not "dump every internal field forever" either

Developer-facing does not mean implementation-detail chaos.

A useful Debug representation still needs rules.

A Range like:

```text
1 ..= 1000000
```

should probably remain visibly a Range rather than expanding into one million integers.

Deep recursive values need safe behavior.

Strings need stable quoting and escaping.

Nominal constructors should remain meaningful.

So Debug is still language surface.

It should reveal structure, but it should reveal the **language's** structure, not every accident of the runtime.

## Deriving is what turns this from a nice idea into something usable

Hand-writing Debug for every ADT and Struct gets old immediately.

So Seseragi allows the compiler to derive instances where the structure is mechanically knowable:

```rust
struct User deriving Show, Debug {
  id: Int,
  name: String,
}
```

This is another place where Rust's `derive(Debug)` is an obvious inspiration in spirit.

But the generated result in Seseragi is still ordinary trait-instance semantics.

There is not a separate reflection runtime that exists only for Debug.

That pattern matters to me:

**Reduce boilerplate without inventing a second semantic system.**

## One string operation would technically work

I could have only `Show`.

Or only `Debug`.

Every value could still become text.

The program would run.

What would disappear is intention.

```text
This text is part of the user-facing representation.
```

and:

```text
This text exists so a developer can inspect the value.
```

would collapse into one operation.

Seseragi already has traits, so keeping the two meanings separate is cheap at the source level.

The hard part was making the compiler and runtime honor that distinction consistently.

## This is exactly the kind of boring language feature I enjoy too much

HKT is more impressive on a feature list.

Monad gets more theory attached to it.

A Web runtime is more dramatic when it finally works.

But `show value` and `debug value` being intentionally different is the kind of thing I notice every day once it exists.

https://seseragi.vercel.app/

A surprising amount of language design is like this.

Two operations return the same primitive type.

You still keep both because **the meaning is not in the return type alone**.

Apparently I am willing to build a compiler just to keep caring about distinctions this small.