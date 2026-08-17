---
title: "I Didn't Add Monad Because I Wanted a Monad"
published: false
tags: programming, functional, types, seseragi
description: "Maybe, Either, and Effect all needed the same thing: use a successful result to choose the next computation. The shared abstraction showed up afterward."
series:
main_image:
canonical_url:
---

Seseragi has Monad.

It has `flatMap`.

It has `>>=`.

It has `do` notation.

If you only look at that surface, a very reasonable conclusion is:

> Ah. This language was made by someone who wanted Monad in the language.

I do like Monad.

That is not why it ended up here.

The need appeared in much more ordinary code first.

## I wanted the next computation to depend on the previous result

Suppose I have:

```text
Maybe<User>
```

If a User exists, I want to use its ID to look up a Profile:

```text
User -> Maybe<Profile>
```

`map` is not quite the operation I need.

`map` works beautifully when the function returns an ordinary value:

```text
A -> B
```

so:

```text
M<A> -> M<B>
```

But here the function already returns another `Maybe`:

```text
A -> Maybe<B>
```

A plain map would produce:

```text
Maybe<Maybe<B>>
```

That is a valid type.

It is usually not the result I wanted.

I wanted one layer:

```text
Maybe<B>
```

So the useful operation becomes:

```text
(A -> M<B>) -> M<A> -> M<B>
```

That is `flatMap`.

The theory name came after the practical need.

## If this had happened only for Maybe, I might have stopped there

A Maybe-specific helper would have been easy.

The problem was that the same shape kept returning.

With Either:

```text
Either<E, A>
-> use A to choose the next Either<E, B>
-> Either<E, B>
```

With Effect:

```text
Effect<R, E, A>
-> use A to choose the next Effect<R, E, B>
-> Effect<R, E, B>
```

Different contexts.

Same composition shape.

That was the point where keeping three unrelated operations started to look less simple than naming the common capability.

Eventually the answer was:

**This is Monad.**

## Haskell already has the whole vocabulary waiting for this

In Haskell, `>>=` and `do` are central enough that the pattern has a famous name before you even encounter my little problem.

The corresponding type looks like:

```haskell
(>>=) :: Monad m => m a -> (a -> m b) -> m b
```

So Seseragi's surface obviously carries Haskell influence.

I like the idea of describing a shared computation shape through a type class.

But my development order was almost backwards from a theory-first story:

```text
I want Monad
↓
find uses for Monad
```

was not what happened.

It was:

```text
Maybe needs this
Either needs this
Effect needs this
↓
these are the same operation
↓
that operation already has a name
```

That distinction matters to how I think about language features.

## TypeScript gives the same problem several different faces

In TypeScript/Web code, I have used versions of this idea constantly without calling all of them Monad.

Promise composition:

```ts
fetchUser()
  .then(user => fetchProfile(user.id))
```

The callback returns another Promise, and the chain stays at one Promise layer.

Nullable values may use optional chaining or branches.

Exceptions use `try/catch` and control flow.

Different contexts tend to get different APIs and syntax.

That is completely practical.

Seseragi made another choice: when several contexts really share the same "dependent next computation" shape, let the type-class layer express that commonality.

## Go makes the dependence wonderfully explicit

Go often writes the sequencing directly:

```go
value, err := stepOne()
if err != nil {
    return err
}

next, err := stepTwo(value)
if err != nil {
    return err
}
```

There is very little mystery about what happens next.

The previous result is bound to a name.

Failure is checked explicitly.

Then the next step receives the value.

I understand why that style is attractive.

Seseragi simply decided that Maybe, Either, and Effect should also be able to expose their shared composition law through one reusable capability.

Different languages place the abstraction boundary in different places.

## The trait is not much more complicated than the need itself

Seseragi's Monad contract is essentially:

```rust
trait Monad<M<_>>
where Applicative<M> {
  fn flatMap<A, B>
    f: (A -> M<B>) -> value: M<A> -> M<B>
}
```

`M<_>` is the outer context.

The callback receives the successful value and returns the next computation in the same context.

`flatMap` keeps the result at one `M` layer.

Once higher-kinded parameters and shared traits already exist, the abstraction is surprisingly direct.

The difficult part is not writing the signature.

It is making each instance's meaning honest.

## The same operation does not mean every Monad behaves the same

Maybe can stop at `Nothing`.

Either can keep the first `Left`.

Effect carries requirements, failures, and execution ordering.

Array/List flatMap means concatenating generated collections in source order.

The type scheme is shared.

The semantics of the context are not erased.

That is an important point for me because abstraction can become misleading when it pretends differences no longer matter.

Monad tells me how the *shape of composition* is shared.

It does not say Maybe and Effect are the same thing.

## `>>=` appeared because `flatMap` already existed

Seseragi also has the operator surface:

```text
>>=
```

But the design order in my head was not:

```text
I want a cool bind operator
↓
invent Monad around it
```

It was the opposite.

The ordinary named operation came first conceptually:

```text
flatMap
```

Once the common capability existed, `>>=` became another way to write the same operation.

The Tour was deliberately reorganized around this principle too.

Issue #262 moved `<$>`, `<*>`, and `>>=` earlier into concrete-type lessons so users can first see them as alternate surfaces for operations they already understand, then encounter Functor/Applicative/Monad as the abstraction that unifies those experiences.

https://github.com/KentaroMorishita/seseragi/issues/262

That work is completed now.

I much prefer:

> Oh, `>>=` is the same operation I already used on Maybe.

before:

> Memorize this symbol because Monad says so.

## `do` is also not supposed to be a separate programming world

Seseragi can write sequential code like:

```rust
pub effect fn main = do {
  first <- stepOne
  second <- stepTwo first
  println second
}
```

I like how readable that is.

But I do not want `do` to become the only way these programs can exist.

The semantics should already be expressible through the underlying composition operations.

`do` is syntax for the case where reading the computation top-to-bottom is nicer.

If I want to compose explicitly, `flatMap` and `>>=` remain ordinary options.

The syntax should improve readability, not create a second semantic universe.

## The most important Monad decision was actually where *not* to add one

Seseragi's Signal has Functor and Applicative instances.

It intentionally does **not** have a standard Monad instance.

That is not because implementing `flatMap`-like behavior for time-varying values is impossible.

The question is what it should *mean*.

A dependent Signal operation tends to imply dynamic dependency switching:

```text
current Signal value
↓
choose another Signal
↓
subscriptions/dependency graph change over time
```

That is a much stronger semantic commitment than mapping a Signal or combining independent Signals.

For the things I actually wanted from Signal — transformed values and glitch-free combination of multiple Signals — Functor and Applicative were enough.

So the standard library stops there.

The specification still says Signal and Validation are Applicative but not Monad, and the completed Signal Tour work explicitly teaches that boundary:

https://github.com/KentaroMorishita/seseragi/issues/179

This is probably the strongest evidence that "Monad is cool" was not the design rule.

If that were the rule, I would keep pushing the abstraction everywhere I technically could.

## "Can this be a Monad?" is a weaker question than "Do I want Monad semantics here?"

That distinction has become useful beyond Signal.

A type supporting more abstractions is not automatically better.

The useful questions are:

```text
What operations are natural for this type?
What laws and runtime behavior would those operations promise?
Will users benefit from treating this as the same capability?
```

Sometimes the answer is Monad.

Sometimes Applicative is enough.

Sometimes neither belongs there.

The abstraction should follow the meaning, not the feature checklist.

## The finished specification makes the path look cleaner than it was

Today you can open the standard library specification and see a neat relationship:

```text
Functor
  ↓
Applicative
  ↓
Monad
```

with standard instances assigned to various types.

That looks intentional and orderly.

The development experience was messier:

```text
I want to transform Maybe
↓
I want to combine things
↓
I want the next step to depend on the previous result
↓
Either needs the same thing
↓
Effect needs the same thing
↓
oh, that's Monad
```

The clean hierarchy is real.

So is the messy path that found it.

## I still like Monad, which makes this explanation suspiciously convenient

There is no point pretending otherwise.

When the common shape emerged and it really was Monad, I was happy about it.

But that happiness came after the constraint from actual code.

The order matters because it is also the guardrail against stuffing the language with abstractions just because I enjoy them.

The Tour is here:

https://seseragi.vercel.app/tour/

If I had to explain why Seseragi has Monad in one sentence, it would be:

**Not because I wanted to put Monad in a language, but because ordinary Maybe/Either/Effect code kept asking for the same dependent composition operation.**

The fact that the operation had a beautiful existing abstraction was a bonus.

A very satisfying bonus, though.