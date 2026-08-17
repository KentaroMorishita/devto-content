---
title: "where Started Feeling Less Like a Constraint and More Like a Dependency"
published: false
tags: programming, types, generics, seseragi
description: "A generic function does not need to know what A is. It does need evidence for the operations it uses. That changed how I read where."
series:
main_image:
canonical_url:
---

Generics immediately create a useful kind of freedom:

```rust
fn keep<A> value: A -> A = value
```

`A` can be anything.

Then you write this:

```rust
fn same<A> left: A -> right: A -> Bool =
  left == right
```

and realize:

Wait.

`A` cannot be *anything*.

This function needs to compare two values.

So the type has to say that too:

```rust
fn same<A> left: A -> right: A -> Bool
where Eq<A> =
  left == right
```

At first I thought of `where` as the place where generic types get restricted.

After using traits and instances for a while, I started reading it differently.

**`where Eq<A>` is a dependency declaration.**

The function is asking the outside world to provide the ability to compare `A`.

## "A must satisfy this condition" is true, but not quite how I think about it anymore

The usual explanation of a generic constraint is something like:

```text
A is allowed only if it satisfies Eq
```

That is not wrong.

But when implementing Seseragi's trait system, this reading became more useful to me:

```text
This function uses Eq operations.
Therefore it requires Eq<A> evidence.
```

The difference is subtle.

One sounds like classifying acceptable types.

The other sounds like declaring what the function depends on.

And compiler-wise, the second one is closer to what has to happen.

At the call site, some actual instance evidence has to be selected and carried across the generic boundary.

`where` is not decorative metadata.

Something has to satisfy the request.

## Rust and Haskell make the capability requirement easy to see

Rust might write:

```rust
fn same<T>(left: T, right: T) -> bool
where
    T: PartialEq,
{
    left == right
}
```

Haskell writes the constraint directly in the type:

```haskell
same :: Eq a => a -> a -> Bool
same left right = left == right
```

The surfaces differ, but the same relationship is visible:

```text
I do not need a specific concrete type.
I do need this operation to be available.
```

Seseragi's:

```rust
where Eq<A>
```

is much closer to that view than to a runtime check saying "maybe this value has an equality method."

The type checker should know the evidence before execution.

## TypeScript often expresses a different kind of requirement

TypeScript's structural constraints are incredibly useful:

```ts
function nameOf<T extends { name: string }>(value: T): string {
  return value.name
}
```

Here the requirement is essentially:

```text
Give me a value whose shape contains name: string.
```

Seseragi can express structural requirements with Records too.

That is a different question from:

```text
Give me an Eq<A> implementation selected by the trait/instance system.
```

I did not want to collapse these two ideas just because they both restrict generic code.

A structural shape requirement and a type-class capability requirement carry different meaning.

That distinction became clearer precisely because I had spent so long enjoying TypeScript's structural flexibility.

## Go makes capability satisfaction lighter in another way

Go interfaces let a type satisfy a contract implicitly when it has the required method set.

That is wonderfully low-ceremony.

There is no explicit `instance Foo<Bar>` declaration merely to announce conformance.

Seseragi's type classes make a different tradeoff.

Instance selection is explicit semantic evidence the compiler tracks.

That matters when generic constraints, imported instances, derived instances, operators, and higher-kinded traits all need to agree on which implementation is being used.

I am not claiming one model is universally better.

The distinction that mattered for Seseragi was:

**I want capability selection to remain visible to the compiler as one coherent mechanism.**

## A generic function should list only the abilities it really needs

The specification has examples with the same shape as:

```rust
fn member<A>
  target: A -> values: List<A> -> Bool
where Eq<A> =
  any (\value -> value == target) values
```

This function does not care whether `A` is Int, String, UserId, or a custom ADT.

It uses one ability:

```text
equality
```

So the signature keeps exactly that information:

```text
A can remain unknown.
Eq<A> cannot.
```

I really like this style of dependency.

The function does not require membership in some large inheritance hierarchy.

It just asks for the operation it actually uses.

## If several abilities are needed, ask for several abilities

Suppose an operation needs both equality and hashing.

Then the requirement can simply be:

```rust
where Eq<A>, Hash<A>
```

I do not need to invent a combined parent abstraction called something like:

```text
ComparableAndHashableThing
```

just so the function can mention both.

That makes `where` feel less like taxonomy and more like a dependency list.

The function uses equality.

The function uses hashing.

Say both.

Rust trait bounds and Haskell constraint lists have a similar appeal here: capability requirements can be composed at the use site instead of forcing every useful combination into a predesigned hierarchy.

## If the instance is missing, the program should not compile

Of course this:

```rust
where Eq<A>
```

cannot manufacture equality out of nowhere.

When `same` or `member` is instantiated at some concrete type, the compiler has to find an appropriate `Eq` instance.

If none exists, compilation should fail.

That means the function body never has to hope at runtime that equality happens to be available.

The dependency was checked before the program ran.

This is the point where `where` stops feeling like a comment about generic parameters and starts feeling like an actual input to compilation.

## Then I discovered that `Eq<Int>` could work for `==` but fail through `where`

This was a great bug for clarifying the whole idea.

User-defined evidence could work.

For example, a custom `Eq<Status>` instance could satisfy a generic `where Eq<A>` function.

Then I tried the same generic function with `Int`:

```rust
fn member<A>
  target: A -> values: List<A> -> Bool
where Eq<A> =
  any (\value: A -> value == target) values

pub effect fn main =
  member 1 `[1, 2, 3]
  |> println
```

Seseragi's specification says Int has equality.

Ordinary integer `==` already works.

And yet the generic call could report that the required trait instance was unavailable.

That gap became:

https://github.com/KentaroMorishita/seseragi/issues/394

As of this draft, #394 is still open.

My first reaction was basically: how can Int be equal enough for `==`, but not equal enough for `where Eq<A>`?

The answer was compiler plumbing.

## The standard instance was living on a special path

The current implementation has standard equality/operator identities that can participate in dedicated operator lowering without necessarily being materialized through the same first-class dictionary/evidence path used by generic calls.

So from inside the compiler, there were two routes.

From the language user's perspective, there was only supposed to be one `Eq`.

That mismatch is the bug.

It also gave me a very concrete rule:

```text
x == y
Eq.eq x y
where Eq<A>
```

must all observe the same trait-instance semantics.

The compiler may keep an optimized operator ABI internally.

It cannot let that optimization create a second meaning of `Eq`.

## `where` exposed that a capability is only real if it can cross boundaries

The issue is bigger than `Int`.

#394 is explicitly about making specified standard instances available as normal evidence across:

```text
concrete operations
generic calls
nested constraints
partial application
module boundaries
Core IR / lowering
CLI
WASM
Playground
```

It also covers standard, local, imported, derived, structural, and conditional instances.

That scope initially looks huge for a bug discovered by one `member 1 ...` example.

But if `where` really means:

> Bring me this capability.

then every legitimate source of that capability has to be usable through the same contract.

Otherwise `where` only works in selected compiler neighborhoods.

## The Prelude registry is still being consolidated too

There is another open issue connected to the same problem:

https://github.com/KentaroMorishita/seseragi/issues/329

The standard library specification lists traits such as Eq, Ord, Hash, Show, Debug, arithmetic traits, Functor, Applicative, Monad, Iterable, Reducible, Traversable, JSON traits, and more.

But current semantic support, public Prelude artifacts, operator registries, and introspection do not yet all share one complete canonical registry.

#329 is about making that registry the single source of truth.

Again, this sounds far away from:

```rust
where Eq<A>
```

It really is the same promise.

If `where` names a capability, the compiler and tooling need one answer for what that capability is and which standard instances provide it.

## I now read `where` as the type-level side of dependency injection

Not literally as a framework pattern.

But the mental analogy is useful.

A normal function parameter says:

```text
I need this value.
```

A trait constraint says:

```text
I need this capability for this type.
```

So in a rough sense:

```text
value dependencies -> parameters
type capability dependencies -> where
```

That is the reading that made the feature click for me.

Generics remove concrete type assumptions.

`where` adds back only the capabilities the implementation actually relies on.

## Generics made the function free. `where` tells you what the freedom costs

This:

```rust
fn keep<A> value: A -> A = value
```

requires almost nothing from `A`.

This:

```rust
fn same<A> left: A -> right: A -> Bool
where Eq<A> =
  left == right
```

still does not care what `A` *is*.

It only cares what `A` *can do*.

That distinction is the part I wanted.

Not unrestricted generic cleverness.

Not a hierarchy that classifies every type in advance.

Just enough information to make the operations in the body legitimate.

The source syntax is one `where` line.

The compiler bug taught me what that line really promises:

**If a function asks for an ability, the language has to be able to bring that ability there — standard or user-defined, local or imported, operator or ordinary function.**