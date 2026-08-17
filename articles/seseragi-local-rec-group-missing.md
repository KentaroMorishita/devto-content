---
title: "Mutual Recursion Is in the Spec. Local Code Still Can't Write It Yet."
published: false
tags: programming, compilers, recursion, seseragi
description: "Self-recursion works. Local functions work. The missing piece is the explicit rec group that lets a small set of local functions see each other without hoisting everything."
series:
main_image:
canonical_url:
---

Seseragi has recursion.

It has local functions.

So the next question sounds obvious:

**Can two local functions call each other?**

The specification says yes.

The syntax is:

```rust
rec {
  fn even n: Int -> Bool =
    if n == 0 { True } else { odd (n - 1) }

  fn odd n: Int -> Bool =
    if n == 0 { False } else { even (n - 1) }
}
```

Then I tried it on the current compiler.

It does not work yet.

Another one of those very Seseragi states:

```text
language design: done
compiler path: missing
```

## Self recursion is the easy case

A function calling itself is already a normal requirement:

```rust
fn factorial n: Int -> Int =
  if n <= 1 {
    1
  } else {
    n * factorial (n - 1)
  }
```

For a local function, self recursion means the function's own name has to be visible from its body.

That is manageable without changing how the rest of the block resolves names.

Mutual recursion is different.

Now the graph is:

```text
even -> odd
odd  -> even
```

and source order immediately matters.

## A simple top-to-bottom local scope cannot see `odd` yet

Imagine resolving this normally:

```rust
fn even n: Int -> Bool =
  ... odd ...

fn odd n: Int -> Bool =
  ... even ...
```

While resolving the body of `even`, `odd` appears later in the block.

Under an ordinary lexical "earlier declarations are visible" rule, it does not exist yet.

One solution is to hoist all local function declarations.

JavaScript developers are very familiar with that shape:

```ts
function even(n: number): boolean {
  return n === 0 ? true : odd(n - 1)
}

function odd(n: number): boolean {
  return n === 0 ? false : even(n - 1)
}
```

Function declarations can refer to each other without an explicit recursion group.

That is practical.

It is not the rule I wanted for Seseragi local scope.

## I want normal local scope to remain readable top-to-bottom

Seseragi generally tries not to make later local bindings visible from earlier code automatically.

That makes the block easier to reason about linearly:

```text
what has been introduced so far?
```

Mutual recursion genuinely needs forward visibility.

So instead of changing every local function, the specification creates an explicit region where the rule changes:

```rust
rec {
  ...
}
```

The mental model is:

```text
normal block
  -> earlier bindings are visible

rec group
  -> predeclare all member function names
  -> members can refer to each other
```

I like that the unusual scope rule is visible exactly where it is needed.

## OCaml's answer is closer to this than Haskell's

Haskell binding groups are recursive in a way that makes mutual recursion feel very natural:

```haskell
even' 0 = True
even' n = odd' (n - 1)

odd' 0 = False
odd' n = even' (n - 1)
```

OCaml makes the recursive group explicit with `let rec ... and ...`.

Seseragi's `rec { ... }` is much closer in spirit to the second idea:

**Open a special recursive group only where forward references are actually intended.**

The syntax itself is not the interesting part for me.

The important design choice is refusing to make every local function implicitly hoisted just to solve one recursive case.

## The implementation gap is tracked separately

The missing `rec` group is:

https://github.com/KentaroMorishita/seseragi/issues/346

As of this draft, #346 is still open.

The current block parser accepts ordinary local declarations but does not yet carry a `rec`-group representation through the surface syntax and typed compiler pipeline.

That means this is not merely a name-resolution bug in an otherwise complete feature.

The construct itself still needs to be wired vertically.

## Of course one small keyword touches the whole compiler

The parser must read the group.

Then the resolver has to predeclare member symbols.

Type checking has to keep the identities stable.

Members may capture bindings from before the group.

They must not magically capture bindings declared after the group.

Typed HIR and Core IR need a representation that can lower the shared closure environment correctly.

The backend has to emit mutual recursion safely.

Formatter, references, rename, hover, and Analysis need to understand that every reference points to the same symbols.

It is another classic language-implementation joke:

```text
visible syntax size: 3 letters
implementation surface: parser to tooling
```

## The group can capture the past, not the future

One subtle part of the spec is the capture boundary.

This should be reasonable:

```text
outer binding
↓
rec group captures it
```

But a member should not reach forward past the group and capture a local binding that has not been introduced yet.

So the visibility shape is roughly:

```text
before-group bindings
  -> visible inside group

group member names
  -> all visible inside group

after-group bindings
  -> not visible inside group
```

That lets mutual recursion work without turning the entire block into unrestricted forward-reference territory.

## Local `effect fn` creates a real implementation dependency

The `rec` design is meant to support both pure local functions and local Effect functions.

But local `effect fn` itself is another specified-but-unwired feature:

https://github.com/KentaroMorishita/seseragi/issues/345

That makes the implementation graph explicit:

```text
#345 local effect fn
↓
#346 local rec group can include effect fn members
```

The language specification can describe both features independently.

The implementation still has an order.

This is one reason the Seseragi roadmap increasingly looks like a dependency graph rather than a numbered checklist.

## I am deliberately not making arbitrary values recursively initialized

Once a language gets a `rec` block, another question appears:

```text
Can ordinary value bindings be mutually recursive too?
```

Something like:

```text
let a = b
let b = a
```

That immediately opens harder evaluation questions.

Is the language lazy here?

What is initialized first?

What happens with cycles?

Do we need runtime indirection?

Seseragi does not currently need those semantics.

So the scope is intentionally narrow:

**recursive function declaration groups.**

The feature does not expand merely because the keyword could theoretically support more.

## I am also not using mutual recursion as an excuse for global hoisting

The other tempting shortcut is:

> Fine, just predeclare every local function in the block.

That would solve the `even`/`odd` example.

It would also change the visibility rules for all local functions everywhere.

I do not want a feature with a narrow requirement to silently rewrite the ordinary scoping model of the language.

So the weird rule gets a visible boundary:

```rust
rec { ... }
```

This is becoming a common Seseragi design habit:

**Keep the default rule simple. Make the exceptional capability explicit where it is needed.**

## This sample is still specification code today

At the moment, do not paste this into the Playground expecting current `main` to accept it:

```rust
rec {
  fn even ...
  fn odd ...
}
```

#346 is open.

The current Tour is here:

https://seseragi.vercel.app/tour/

Once the feature lands, the reference documentation will probably reduce all of this to one clean sentence:

> Use `rec { ... }` for an explicit local mutually recursive function group.

That is exactly what reference docs should do.

But the development state is more interesting:

```text
self recursion works
local fn works
mutual-recursion semantics are already designed
rec group is the last missing connection
```

Another tiny surface waiting for an annoyingly vertical implementation.