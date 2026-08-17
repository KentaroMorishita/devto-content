---
title: "I Didn't Want Assignment. I Wanted to Change a Signal's Current Value."
published: false
tags: programming, reactive, state, seseragi
description: "Seseragi keeps ordinary bindings immutable, then gives MutableSignal a deliberately narrow update surface: :=. It looks like assignment, but that is not what it means."
series:
main_image:
canonical_url:
---

Seseragi does not have ordinary mutable variables.

A `let` binding does not later become another value.

That feels nice until you start building Web UI and encounter the most predictable requirement imaginable:

> I clicked the button. Please change the count.

So Seseragi has Signal.

And when I started designing the update surface, I added:

```text
:=
```

It looks like assignment.

It is deliberately **not** general assignment.

## The binding itself does not change

A Tour example can look like this:

```rust
import * as signals from "std/signal"

pub effect fn main = do {
  state <- signals.make 1
  state := 42
  current <- *state
  println `current: ${current}`
}
```

The tempting reading is:

```text
assign 42 to the variable state
```

But `state` is still bound to the same `MutableSignal<Int>`.

What changes is the **current value published by that Signal source**.

The name is not rebound.

The Signal is updated.

That difference is the reason I was willing to use an assignment-looking symbol at all.

## React, Vue, and Solid all separate ordinary variables from reactive updates somehow

React does not ask you to mutate a local variable and hope the UI notices:

```ts
const [count, setCount] = useState(0)
setCount(42)
```

Vue refs put the reactive slot behind `.value`:

```ts
const count = ref(0)
count.value = 42
```

Solid commonly exposes getter/setter pairs.

The exact APIs differ, but they all recognize the same problem:

```text
ordinary local assignment
```

and:

```text
update something whose changes participate in a reactive system
```

are not quite the same operation.

Seseragi makes that distinction through types:

```text
ordinary value        -> immutable
Signal<A>             -> time-varying read-only view
MutableSignal<A>      -> updateable Signal source
```

Then `:=` is allowed only in that last world.

## In a strange way, `:=` exists so I can avoid adding general assignment

That is the part I like most.

A broad assignment operator would mean code like:

```rust
let count = 1
```

could no longer be read as "count is this value" without also wondering whether `count` changes later.

JavaScript, Python, PHP, and Go all make mutable variables an ordinary tool, and that is completely practical.

I have used them for years.

This is not a moral argument that mutation is bad.

When designing Seseragi from scratch, I simply found that most bindings did not need to change.

The changing thing in a UI is more specific:

**state over time**.

So instead of making every binding potentially mutable, I put change into a type that explicitly means change.

`:=` is narrow because mutation is narrow.

## The named operation still exists

The operator is not the only way to update a Signal.

Seseragi also has:

```rust
signals.set 42 state
```

The current Tour deliberately teaches both forms:

```rust
pub effect fn main = do {
  state <- signals.make 1

  signals.set 21 state
  afterNamed <- signals.read state

  state := 42
  afterOperator <- *state

  println `signals.set: ${afterNamed}`
  println `:=: ${afterOperator}`
}
```

That correspondence was made explicit in the completed Tour issue:

https://github.com/KentaroMorishita/seseragi/issues/252

I do not want to delete `signals.set` because `:=` is shorter.

The two surfaces have different reading advantages.

A named function is explicit and fits naturally into APIs and pipelines.

The operator makes "this is an update" visually immediate.

**Two surfaces, one meaning.**

That pattern appears elsewhere in Seseragi too.

## Reading a Signal has the same dual surface

The named read operation is:

```rust
signals.read state
```

The shorter form is:

```rust
*state
```

Again, the symbol borrows a familiar visual idea.

If you know C or Rust, `*` looks like dereference.

But Seseragi is not claiming that a Signal is a pointer.

`*state` means:

> Read the current value of this Signal.

And that read is effectful.

The completed #252 contract explicitly says `*state` returns the same Task as `signals.read state` rather than behaving like a pure memory dereference.

Familiar punctuation does not force familiar semantics.

Sometimes it just gives the eye a useful clue.

## That is also why `:=` is not a generic mutation operator

If `:=` worked on everything, its meaning would immediately become vague.

Could I write:

```rust
count := 42
```

for an ordinary Int binding?

Could I assign Struct fields?

Could I mutate Array elements?

Could an imported binding change?

I do not want those questions attached to this symbol.

The intended statement is much smaller:

```text
left side is MutableSignal<A>
right side is A
update the Signal source
```

So when I see `:=`, I know something useful about the left side.

It is not "a mutable thing" in the abstract.

It is a reactive state source.

## Read and write being effects matters

A Signal's current value is time-dependent.

Reading it is not the same kind of operation as reading an immutable local value.

Updating it can trigger reactive graph work and subscriber notification.

So these operations live in Effect/Task semantics.

That is why this code uses binding inside `do`:

```rust
current <- *state
```

and why `:=` participates in the effectful world rather than pretending to be a pure expression that swaps a hidden variable.

This keeps the outside-world boundary visible even though the operator syntax is short.

## A short read plus a short write can tempt you into unsafe read-modify-write

Once you have:

```text
*state
state := value
```

it is tempting to implement updates by:

```text
read current value
compute next value
write it back
```

That can be the wrong abstraction when the update needs to be atomic with respect to the Signal runtime.

The Tour contract explicitly warns against treating `*` plus `:=` as the canonical read-modify-write primitive.

For updates based on the current value, use the dedicated update operation such as `signals.update`.

This is another reason I do not want operator concision to become operator supremacy.

Different semantics deserve different operations even when one can be improvised from smaller pieces.

## Mutable state is localized by type instead of spread through syntax

This ended up being the design principle I care about more than the exact symbols.

In Seseragi:

```text
let binding
  -> stable

Signal
  -> changes over time, read-only from this view

MutableSignal
  -> source that may be updated
```

The possibility of change travels with the type.

I do not need to inspect the whole function body to discover whether a random `let` name is reassigned later.

When I see Signal operations, I know I have crossed into time-varying state.

That makes UI state feel like a normal language value with explicit capabilities rather than a separate state-management religion.

## Framework state APIs solve more than the language needs to solve

React hooks, Vue refs, Redux stores, state machines, and reactive libraries all carry their own lifecycle and framework concerns.

Seseragi is not trying to reimplement each model as a syntax feature.

The language-level requirement is smaller:

```text
represent a value that can change over time
transform/combine it
read it through an effect
allow controlled sources to update
```

Then Web UI can build on top of those ordinary language pieces.

That was the attraction.

I did not want the moment state appeared to be the moment the program switched into a different mini-language.

## `:=` looks imperative, but it actually protects the declarative baseline

There is something funny about that.

The most assignment-looking syntax in Seseragi is part of the design that keeps ordinary bindings immutable.

It is not:

```text
Everything can change now.
```

It is:

```text
This specific MutableSignal is the place where change lives.
```

The visual similarity to assignment makes the update obvious.

The type restriction keeps the meaning narrow.

That combination feels right to me.

## Try the named and operator forms side by side

The Tour already includes this learning path:

https://seseragi.vercel.app/tour/

A minimal example is:

```rust
import * as signals from "std/signal"

pub effect fn main = do {
  state <- signals.make 1
  signals.set 21 state
  first <- signals.read state

  state := 42
  second <- *state

  println `${first} -> ${second}`
}
```

The useful question is not which surface is more "Seseragi-like."

Both are canonical.

The thing I want the code to preserve is the semantic distinction underneath them:

**I am not assigning a new value to a variable. I am updating the present value of something whose job is to change over time.**