---
title: "The Spec Had Local effect fn. The Parser Didn't."
published: false
tags: programming, compilers, effects, seseragi
description: "Top-level effect functions worked. Local pure functions worked. The spec even defined local effect functions. The current parser simply had no path for them yet."
series:
main_image:
canonical_url:
---

Reviewing a language specification occasionally produces a very specific kind of surprise:

> Wait. This is documented. Why doesn't the compiler accept it?

That happened with local `effect fn` declarations in Seseragi.

Module-level `effect fn` exists.

Local pure `fn` exists inside blocks.

The specification defines local `effect fn` too.

And the current parser still does not accept it.

**The feature existed in the language contract before the last compiler path existed.**

## Ordinary local functions already work

A small helper can stay near the code that needs it:

```rust
fn outer value: Int -> Int = {
  fn double n: Int -> Int = n * 2
  double value
}
```

That is useful for the same reason local functions are useful in many languages.

The helper does not deserve module-level visibility.

It can capture bindings from the surrounding lexical scope.

Its lifetime and meaning stay close to the flow it supports.

Once Seseragi had that, I naturally wanted the same lexical convenience for helpers that perform Effects.

## TypeScript and Go make this feel completely ordinary

In TypeScript, I might write:

```ts
async function outer(userId: string) {
  async function loadProfile() {
    return fetch(`/users/${userId}`)
  }

  return loadProfile()
}
```

The nested function uses normal lexical scope.

The fact that it performs async I/O does not force it to become module-level.

Go has a similarly ordinary story with closures:

```go
loadProfile := func() (*Profile, error) {
    return repo.Load(userID)
}
```

Again, locality and I/O capability are separate concerns.

That is the behavior I wanted in Seseragi too:

```text
normal local lexical scope
+
the same Effect contract used everywhere else
```

## I do not want Effectful helpers pushed to the module surface

Imagine one application flow needs a tiny helper that talks to a service.

It is not reusable outside that flow.

It should not be exported.

It may not even make sense elsewhere in the module.

If every Effectful helper has to live at the top level merely because it is Effectful, the module starts accumulating implementation details as named top-level declarations.

That feels especially strange after years of TypeScript and Go, where small local helpers are completely normal.

So the intended Seseragi rule is boring in the best way:

**A local effect function is the same kind of effect function, just in local lexical scope.**

## Why not call it `async`?

TypeScript's `async` is an excellent signal for its runtime model:

```ts
async function load() { ... }
```

The function returns a Promise.

Seseragi's Effect contract is trying to say something different and broader:

```text
R: what capabilities/environment are required
E: how the operation may fail
A: what result it produces
```

So I do not want local Effectful helpers to become a separate lightweight `async` feature.

They should use the same language semantics as module-level `effect fn`, including the same `with`, `fails`, `where`, and inferred-contract behavior.

The scope changes.

The meaning should not.

## Right now, the parser stops the story before semantics even begin

The implementation gap is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/345

As of this draft, #345 is still open.

The current block parser recognizes local `let` and `fn` items.

It does not yet have a block-item representation/path for local `effect fn`.

So this is not a subtle runtime bug where the wrong Effect environment is inferred.

The syntax does not get far enough for that.

That is almost refreshing.

The hole is extremely clear.

## Unfortunately, "parse one extra keyword" is not the whole implementation

The obvious first thought is:

> Add `effect` before local `fn`. Done.

Then you write the issue properly and the feature expands vertically through the compiler.

A local function has scope behavior.

It can capture earlier lexical bindings.

It must not see later bindings as if they were hoisted from the future.

It should support self recursion.

The language has a separate explicit design for mutual recursive groups.

Then the Effect layer adds:

```text
R
E
A
with
fails
where
```

The formatter has to understand the declaration.

Analysis, hover, references, Typed HIR, Core IR, and TypeScript lowering need the same identity.

Suddenly "one missing block item" touches most of the compiler.

## Local syntax must not create a cheaper version of Effect semantics

This is the most important completion condition in #345 for me.

It would be easy to implement a compact local form that behaves like:

```text
some vaguely async local function
```

while module-level Effect functions retain the full contract.

That would be a mistake.

Seseragi should not have:

```text
real effect functions at module level
special simplified effect functions inside blocks
```

The desired feature is much smaller:

```text
same effect function
same typing/effect meaning
new lexical location
```

I keep preferring features that make an existing semantic concept available in another place over features that add another parallel concept.

## Lexical capture rules are part of the language's personality too

Seseragi does not want every local declaration to behave as if it were magically hoisted.

A local function may capture a binding that already exists before its declaration.

It should not capture a later binding merely because everything eventually lives in the same block.

The source should remain reasonably readable top-to-bottom.

JavaScript function declarations have their own hoisting rules.

Seseragi does not need to copy them just because nested functions look familiar.

The surface can resemble another language while the scope semantics stay intentionally different.

## Self recursion and mutual recursion are different questions

A local function calling itself is a natural expectation.

Mutually recursive local declarations are a stronger scope arrangement.

Seseragi has an explicit `rec` group design for that rather than silently making every local declaration group mutually recursive.

#345 therefore includes self recursion but deliberately leaves local `rec` groups to a separate implementation issue.

I like this kind of narrow boundary.

"Local function" does not have to secretly imply every possible recursive scope rule.

## This is a classic spec-ahead-of-implementation moment

Seseragi is still being designed and implemented in parallel.

So the repository periodically contains this state:

```text
normative specification says yes
fixtures/contracts may already describe it
current main says no
```

A finished language reference tends to erase this period from history.

The feature simply appears one day as if it had always been there.

From the development side, though, the interesting moment is often exactly when I notice:

> I already designed this. Why didn't I wire it?

That discovery turns into an Issue, and sometimes into an article before the implementation even lands.

## Do not paste this sample into the Playground yet

At the moment, local `effect fn` is still implementation-gap code.

This is the intended shape, not a current working sample:

```rust
fn outer userId: String -> ... = {
  effect fn loadProfile = ...
  ...
}
```

Issue #345 is still open.

The current Tour can demonstrate module-level Effect functions and local pure functions:

https://seseragi.vercel.app/tour/

Once #345 closes, the article can graduate from "the spec already says this" to a real executable example.

Until then, I want to keep the gap visible.

The lesson is not that local Effect functions are difficult in theory.

It is that **a language feature is only real when the same semantics survive every place the specification claims you can use it.**