---
title: "I Deliberately Did Not Make Signal a Monad"
published: false
tags: programming, reactive, functional, seseragi
description: "Seseragi already had Monad. Signal could support dynamic switching. I still decided not to make that the standard capability."
series:
main_image:
canonical_url:
---

Seseragi already had `Maybe`, `Either`, and `Effect`.

It already had Functor, Applicative, and Monad.

So when `Signal<A>` arrived as the language's time-varying value, there was an obvious next question:

**Should Signal be a Monad too?**

I seriously considered it.

Then I decided no.

Not because the abstraction was unavailable.

Because I did not want the semantics it would make ordinary.

## Mapping a Signal feels completely natural

If I have:

```text
Signal<Int>
```

and want a label:

```text
Int -> String
```

then:

```text
Signal<Int>
  -> map
Signal<String>
```

is exactly what I expect.

Likewise, if several independent Signals contribute to one view:

```text
Signal<User>
Signal<Route>
Signal<Settings>
      ↓
Signal<Html<Action>>
```

Applicative-style combination is a good fit.

The dependency graph is still visible in the source.

Those values all contribute to the result, but none of them decides which Signal the program subscribes to next.

I wrote about how that shape led me to Applicative here:

https://dev.to/kentaromorishita/i-kept-combining-independent-values-until-applicative-showed-up

## Monad would mean more than "one more useful method"

The Monad-shaped operation would be roughly:

```text
(A -> Signal<B>)
-> Signal<A>
-> Signal<B>
```

That sounds harmless until you spell out the runtime meaning.

The current `A` value chooses another Signal.

When `A` changes, the chosen inner Signal may change too.

So the runtime has to do something like:

```text
observe outer Signal
↓
choose inner Signal
↓
subscribe to it
↓
outer value changes
↓
unsubscribe old inner Signal
↓
subscribe new inner Signal
↓
keep transaction semantics coherent
```

That is not merely "map, but stronger."

It is dynamic dependency switching.

That is a substantial meaning to hide behind the generic operation `flatMap`.

## Reactive libraries already taught me that flattening strategy matters

RxJS does not present every stream-flattening operation as one obvious universal thing.

It has names such as:

```text
switchMap
mergeMap
concatMap
```

because the flattening strategy changes observable time behavior.

Which inner stream remains subscribed?

Are previous ones cancelled?

Are values merged concurrently?

Are they queued?

Those details are not noise. They are the operation.

Seseragi Signal does need dynamic switching in some situations, and it already has an explicit `switchMap` surface.

What I did not want was to declare:

```text
Signal is Monad
```

and thereby make one particular dynamic switching semantics look like the ordinary generic way to compose all Signals.

## "Can I write a lawful-looking instance?" was not the decision rule

Once a language has type classes, there is a temptation to ask:

```text
Can this type implement Functor?
Can it implement Applicative?
Can it implement Monad?
```

and treat a longer list as a more complete type.

I do not think that is a useful goal.

A standard instance tells users something stronger:

> This capability is one of the normal ways this type is meant to compose.

For Signal, mapping is normal.

Combining known independent dependencies is normal.

Dynamic subscription switching is useful, but semantically heavier.

I wanted that weight to remain visible through an explicit operation name.

## Time makes Signal different from Maybe and Either

Maybe flatMap is conceptually simple:

```text
Nothing -> stop
Just value -> choose next Maybe from value
```

Either similarly propagates `Left` or uses a successful value to choose the next computation.

Effect uses the previous result to build the next deferred effectful step.

Signal has another dimension: **lifetime**.

Its values keep changing.

So a dependent Signal composition changes not only what value is produced, but which dependencies stay alive over time.

The dependency graph itself can change as data changes.

That makes `flatMap` a runtime graph-management policy, not just a type signature.

## Static-looking dependencies are valuable in UI code

A lot of UI code has a shape like:

```text
count -------┐
filter ------┼-> view
route -------┘
```

I can look at that graph and understand what the view depends on.

That visibility is useful.

If arbitrary `flatMap` is the default composition tool, a dependency can become:

```text
this Signal chooses another Signal,
which may change whenever this value changes
```

Sometimes that is exactly what the application needs.

But I do not want every ordinary Signal composition to carry that possibility implicitly.

Applicative's restriction is useful information:

**These dependencies are independent and known here.**

## This is one of the reasons "Applicative is weaker than Monad" is a bad product-design heuristic

Monad can express more dependent composition.

That does not mean every type benefits from advertising that capability.

For Signal, less generic power can make the dependency model easier to read.

The absence of a Monad instance is not a missing feature.

It is part of the type's intended meaning.

That was important enough that the Seseragi Tour explicitly teaches it.

The Signal curriculum work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/179

That issue is completed.

The Tour covers creation, reading, mapping, combination, updates, and the deliberate boundary where Signal has Functor and Applicative but no standard Monad instance.

## A Tour that teaches something the language does *not* have is a little strange

Usually a language tour is a parade of capabilities:

```text
Here is syntax X.
Here is feature Y.
Here is operator Z.
```

Here I wanted a lesson that effectively says:

> You may expect this instance. It is intentionally absent.

I like that.

A type's meaning includes not only the operations it exposes, but also the operations the standard library refuses to normalize.

If the distinction prevents users from casually reaching for a semantically heavy operation, it belongs in the learning material.

## This is also evidence that Seseragi is not trying to maximize "functionalness"

From the outside, Seseragi can look aggressively functional:

- ADTs
- pattern matching
- HKT
- traits/instances
- Functor
- Applicative
- Monad
- `<$>`
- `<*>`
- `>>=`

If the design rule were "make everything fit the FP hierarchy," Signal would be an obvious place to keep pushing.

Instead, the question was:

```text
What does Signal mean in this language?
```

not:

```text
How many abstractions can I legally attach to it?
```

That difference matters more to me than the label "functional programming language."

## Explicit `switchMap` says more than generic bind here

Suppose the current user ID determines which user Signal should be observed:

```text
Signal<UserId>
  -> UserId -> Signal<User>
  -> Signal<User>
```

The operation is useful.

Writing `switchMap` makes the behavior visible:

```text
this code switches the active inner Signal
```

A generic `>>=` would be shorter and more uniform.

It would also hide the most important runtime consequence behind a familiar abstraction.

I would rather spend a few characters and keep the semantics obvious.

## Having Monad support made it easier to decide not to use it

This is the funny part.

Seseragi already has the machinery.

So "Signal is not Monad" is not an excuse caused by implementation cost or missing HKT support.

The abstraction exists.

I simply decided this type should stop at Applicative for its standard generic capabilities.

That makes the choice feel more meaningful to me.

**A language having an abstraction is different from a language applying that abstraction everywhere it possibly can.**

The Signal Tour is here:

https://seseragi.vercel.app/tour/

Monad is useful.

Dynamic Signal switching is useful too.

I just do not think those two facts require `Signal` to advertise Monad as its ordinary identity.