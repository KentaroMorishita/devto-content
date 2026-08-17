---
title: "I Kept Combining Independent Values Until Applicative Showed Up"
published: false
tags: programming, functional, types, seseragi
description: "I didn't start by wanting Applicative. I wanted to combine several independent values without pretending the next computation depended on the previous one."
series:
main_image:
canonical_url:
---

Seseragi has Functor, Applicative, and Monad.

Written like that, it sounds as if I designed the language with a functional-programming textbook open beside me.

The actual path was almost the opposite.

I kept adding ordinary things I wanted to write.

Then, at one of the final composition points, I looked at the shape and thought:

**Oh. This is Applicative Apply.**

That made me laugh a little.

## The need came before the abstraction name

The situation was simple:

```text
I have several values inside the same kind of context.
I want to feed them into one ordinary function.
The second value does not depend on the first one.
```

That last sentence matters.

I am not saying:

```text
Look at the first result, then decide which second computation to run.
```

That would be dependent sequencing, the territory where Monad becomes useful.

I only want to gather independent values.

That is exactly the space Applicative occupies.

## `map` is enough while there is only one wrapped input

Suppose I have:

```rust
let left: Maybe<Int> = Just 10
```

and a normal function:

```rust
fn double value: Int -> Int = value * 2
```

Functor gives me:

```rust
let result = double <$> left
```

Conceptually:

```text
(A -> B)
F<A>
----
F<B>
```

That is easy to understand.

One wrapped value.

One ordinary function.

Map the function inside.

Then a second wrapped input appears:

```rust
let left: Maybe<Int> = Just 10
let right: Maybe<Int> = Just 20
```

and I want:

```text
Just 30
```

Now plain `map` reaches only the first input.

## Currying makes the intermediate value surprisingly concrete

Seseragi functions are curried, so:

```rust
fn add x: Int -> y: Int -> Int = x + y
```

has the shape:

```text
Int -> Int -> Int
```

If I map `add` over the first Maybe:

```rust
add <$> Just 10
```

I do not yet get `Maybe<Int>`.

I get:

```text
Maybe<Int -> Int>
```

There is still a function inside the context, waiting for the second Int.

That intermediate type is the moment `<*>` stopped looking mysterious to me.

I have:

```text
F<A -> B>
```

and:

```text
F<A>
```

I want:

```text
F<B>
```

So apply the wrapped function to the wrapped value.

## That gives the familiar expression

Seseragi's Applicative contract is roughly:

```rust
trait Applicative<F<_>>
where Functor<F> {
  fn pure<A> value: A -> F<A>
  fn apply<A, B>
    wrapped: F<A -> B> -> value: F<A> -> F<B>
}
```

The operator surface for `apply` is `<*>`.

So the two-Maybe example becomes:

```rust
fn add x: Int -> y: Int -> Int = x + y

let result = add <$> Just 10 <*> Just 20
```

Read it left to right:

```text
add
↓ map into Just 10
Maybe<Int -> Int>
↓ apply to Just 20
Maybe<Int>
```

The notation is compact.

The useful part is the intermediate type.

Without that, `<*>` can look like ceremonial punctuation from a strange FP religion.

With it, the operator is almost mechanical.

## The Tour was changed specifically to teach the intermediate type

Seseragi originally had lessons for `<$>`, `<*>`, and `>>=`, but the operators arrived too suddenly.

Issue #251 reworked that path:

https://github.com/KentaroMorishita/seseragi/issues/251

That work is completed now.

The teaching rule is deliberately concrete:

```text
map f value    <-> f <$> value
apply wrapped value <-> wrapped <*> value
flatMap f value <-> value >>= f
```

For Applicative, the Tour explicitly shows that:

```rust
add <$> Just 20
```

has the intermediate type:

```text
Maybe<Int -> Int>
```

before the second `<*>` appears.

I like that order because I did not understand the usefulness of Applicative by memorizing the abstract signature either.

I understood it by hitting the second independent value.

## Haskell already has a beautiful name for this shape

The symbols are obviously Haskell-like.

Haskell has spent decades making Functor, Applicative, Monad, `<$>`, and `<*>` ordinary parts of its ecosystem.

Seseragi absolutely benefits from that existing vocabulary.

But my starting point was not:

> Haskell has Applicative, so Seseragi should too.

It was:

> I need to combine several contextual values, but I do not need the later ones to depend on earlier results.

Then I discovered that this shape already had a very good abstraction.

That experience happens surprisingly often while building the language.

I follow a practical requirement far enough, then find a concept that has been sitting in type theory for years waiting for me.

## TypeScript solves the same practical problem with different APIs

In TypeScript/Web code, I have combined independent asynchronous values with:

```ts
const [user, settings] = await Promise.all([
  loadUser(),
  loadSettings(),
])
```

In UI code, I may simply read several props or pieces of state and pass them into one rendering function.

For nullable values, I might write branches or helpers.

The common shape exists, but the APIs are usually specific to the problem domain.

That is a perfectly reasonable design.

Seseragi chose to expose the common shape through the type-class layer when the contexts support it.

So Maybe and Signal can both be read as Applicative without pretending they have identical runtime behavior.

## Applicative became much more real once Web UI appeared

UI code constantly combines independent inputs:

```text
user state
settings state
route state
      ↓
   view function
      ↓
      Html
```

Those inputs do not necessarily live in one giant mutable store.

And the route value does not necessarily depend on the current user value just because both contribute to the same view.

That distinction is valuable.

If the dependencies are independent, I want the code to say only that much.

Applicative composition is a good fit:

```text
collect several independent contextual values
apply one ordinary function
```

No dynamic dependency switching is implied.

## This is why "Applicative is weaker than Monad" can be a misleading description

Technically, Monad gives you more expressive power: the next computation can depend on a previous result.

But in application code, **more power is not automatically more information**.

If I use an Applicative shape, I am also communicating a restriction:

```text
these inputs are independent
```

That is useful knowledge.

The program cannot quietly choose a completely different second context based on the first value.

Less capability here can mean a clearer dependency structure.

That is one reason Applicative stopped feeling like an awkward chapter between Functor and Monad to me.

Sometimes it is exactly the strongest abstraction I want — and no stronger.

## Signal made that boundary extremely concrete

Seseragi's `Signal<A>` represents a value that changes over time.

It supports mapping.

It supports combining independent Signals through Applicative behavior.

It intentionally does not have a standard Monad instance.

That is still the contract in the current standard library, and the completed Signal Tour makes the boundary explicit:

https://github.com/KentaroMorishita/seseragi/issues/179

Why stop there?

Because Monad-like dependent composition for Signal implies dynamic dependency switching:

```text
read current value
↓
choose which Signal to depend on next
↓
dependency graph changes over time
```

That operation can exist under an explicit name such as `switchMap`.

It does not need to become the default meaning of generic `flatMap` for Signal.

For the common UI case of combining known Signal dependencies, Applicative is enough — and often better.

## The standard library makes the differences between contexts explicit

Seseragi does not say every Applicative runs the same way.

Maybe can fail with `Nothing`.

Either keeps the first `Left`.

Array/List `apply` forms a Cartesian product according to source order.

Effect's Applicative is independent at the type-composition level but still runs left-to-right sequentially by default; parallelism is a separate explicit operation.

Signal combines reactive dependencies according to its transaction/glitch-free semantics.

Same type-class shape.

Different context semantics.

I like that because the abstraction captures exactly the common part without flattening everything else.

## "Independent" also does not automatically mean "parallel"

This was another important distinction for Effect.

Applicative tells me the second computation does not need the *value* produced by the first to be selected.

It does not automatically say the runtime should execute both at the same time.

Those are separate decisions.

The current specification keeps Effect Apply sequential left-to-right and reserves explicit APIs for parallel execution.

That is useful because dependency structure and scheduling policy are not the same thing.

A type abstraction should not smuggle in a runtime strategy merely because the mathematical shape permits it.

## The funny part is that Applicative kept appearing at the final composition point

I would build pieces independently.

A state value here.

Another state value there.

A pure function that knows how to combine them.

Then I would get to the final step and think:

> Wait. This is just `<*>`.

That happened often enough that Applicative stopped feeling imported from functional-programming theory.

It started feeling like the name of a shape I kept recreating anyway.

## I now think of the three abstractions in very ordinary verbs

For Seseragi, the useful mental ladder is roughly:

```text
Functor
  -> transform a value inside a context

Applicative
  -> gather independent contextual values

Monad
  -> use a previous result to choose the next contextual computation
```

The theory underneath matters.

The laws matter.

The compiler evidence matters.

But this is the level where the abstraction becomes useful to me while writing ordinary code.

The Tour is here:

https://seseragi.vercel.app/tour/

When Applicative Apply finally showed up at the exact place my code needed it, I did not feel like I had successfully inserted an advanced FP feature.

I felt like the code had wandered into a well-known shape on its own.

**The abstraction had been waiting there longer than the language had.**