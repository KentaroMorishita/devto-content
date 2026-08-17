---
title: "My Language Had Monad Before It Had Ordinary Function Composition"
published: false
tags: programming, functional, languages, seseragi
description: "Maybe, Either, Functor, Applicative, Monad, HKT... and then I noticed ordinary compose was missing. The implementation order tells a better story than the finished feature list."
series:
main_image:
canonical_url:
---

A programming language slowly accumulates features.

Seseragi got Maybe.

Then Either.

Then Functor.

Applicative.

Monad.

Higher-kinded types.

And then one day I noticed something.

**There was no ordinary function composition.**

The language had `>>=` before it had `compose`.

That order is ridiculous.

I also think it tells a much more accurate story about how the language was actually built than any clean feature table ever will.

## Yes, Monad was already there

Seseragi already had a contract like:

```rust
trait Monad<M<_>>
where Applicative<M> {
  fn flatMap<A, B>
    f: (A -> M<B>)
    -> value: M<A>
    -> M<B>
}
```

It had `flatMap`.

It had `>>=`.

It had `do` notation.

Maybe, Either, and Effect could all be composed through the shared abstraction.

But this extremely ordinary shape:

```text
A -> B
B -> C
```

could not yet be packaged as:

```text
A -> C
```

with a standard `compose` function.

Somehow I had climbed onto the roof before installing one of the stairs.

## In Haskell, this ordering would look especially strange

Haskell's `(.)` is one of the most basic tools in the language:

```haskell
render = label . double
```

Take two ordinary functions and produce another ordinary function.

You can encounter that long before caring about Monad.

Seseragi, meanwhile, already had Haskell-looking operators such as `<$>`, `<*>`, and `>>=` while plain composition arrived later.

That is exactly why I find the accident funny.

If I had been copying a functional-programming-language feature checklist from top to bottom, this almost certainly would not have happened.

The implementation order followed the problems I happened to hit.

Not textbook order.

## `|>` made the omission surprisingly easy to miss

Seseragi got the pipeline operator early:

```rust
value
  |> normalize
  |> validate
  |> render
```

That covered a huge amount of ordinary application code.

If I already have a value, I can keep pushing it left-to-right through functions.

For example:

```rust
fn double value: Int -> Int = value * 2
fn label value: Int -> String = `value: ${value}`

pub effect fn main =
  21
  |> double
  |> label
  |> println
```

This reads well.

I had no practical pain demanding a composition helper every day.

So the missing feature stayed invisible longer than it deserved.

## Pipeline and composition are related, but they put the focus in opposite places

A pipeline starts from a value:

```text
value
  -> f
  -> g
```

Composition starts from functions:

```text
f
+
g
-> a new function
```

If I already have `21`, this is enough:

```rust
21 |> double |> label
```

But sometimes the thing I want to construct is the reusable function itself:

```rust
let render = compose label double
```

Now:

```text
render : Int -> String
```

exists before any input value does.

That is a different use case.

The final computation can be equivalent while the thing the source is building is different.

## TypeScript made it easy for me to treat `compose` as library territory

JavaScript and TypeScript do not have a built-in Haskell-style composition operator at the center of the language.

If I want one, I can write a helper:

```ts
const compose =
  <A, B, C>(f: (value: B) => C, g: (value: A) => B) =>
  (value: A): C =>
    f(g(value))
```

or use a library.

In Web application development, method chains, framework APIs, component composition, and normal nested calls cover a lot of ground anyway.

So my instincts did not scream:

> A language is incomplete until composition is in the Prelude.

`|>` made that even easier to ignore.

Then the abstraction layer got sophisticated enough that `compose` stopped being merely a convenience helper.

## Functor laws made the missing basic function embarrassingly visible

Once the standard library talks about Functor laws, composition appears naturally:

```text
map (compose f g) x == map f (map g x)
```

At that point I had a language with a Functor abstraction but no canonical ordinary `compose` to state one of the most ordinary Functor laws cleanly.

That is when the gap became hard to ignore.

The standard library specification now includes `compose` in the core Prelude, along with `identity`, `const`, and `flip`.

It also uses `compose` directly in the Functor composition law.

So today the finished design looks perfectly normal.

The order that produced it was not.

## Go offers a useful reminder that composition does not need to dominate application code

Go is a good counterweight here.

A lot of Go code is perfectly happy to write ordinary intermediate steps:

```go
value := double(21)
label := format(value)
```

There is no need to turn every pair of functions into a point-free composition.

I agree with that instinct more than the presence of `compose` in Seseragi might suggest.

Adding composition does not mean I want Seseragi code to become a puzzle of function combinators.

For many application flows, `|>` is more readable.

`compose` exists because functions are values too, and sometimes **the function itself** is what I want to build and reuse.

That is enough reason.

## The feature is almost offensively ordinary

After talking about HKT and Monad, ordinary function composition sounds like a step backward in sophistication.

The implementation idea is basically:

```rust
fn composed value: Int -> String =
  label (double value)
```

turned into a reusable higher-order helper.

Nothing exotic.

That is what makes the omission so good.

Building difficult features does not imply that all simpler features are automatically covered.

A language can be sophisticated and still have completely mundane holes.

I keep finding those holes by actually trying to write programs rather than by reading the feature list.

## The current Prelude really does include `compose`

The current standard library contract lists:

```text
identity
const
compose
flip
```

as core Prelude functions.

The Functor law is expressed as:

```text
map (compose f g) x == map f (map g x)
```

So this is no longer a missing feature story in the present tense.

The interesting artifact is the historical order:

```text
Monad existed first.
compose was noticed later.
```

The finished specification naturally erases that weirdness.

That is why I like keeping these development stories around.

## The order was not a design failure so much as a record of what I needed first

I do not think implementing Monad before compose was inherently wrong.

At the time, the pressure was coming from:

```text
Maybe composition
Either composition
Effect sequencing
shared map behavior
HKT for reusable traits
```

Those were real problems in the code I was writing.

`|>` already handled the everyday value-flow use case.

Then later I needed function composition itself.

The language grew in demand order.

That demand order simply does not look like a textbook curriculum.

## A textbook would probably draw a much nicer staircase

Something like:

```text
values
↓
functions
↓
function composition
↓
Functor
↓
Applicative
↓
Monad
```

Seseragi's development history looked more like:

```text
if feels wrong
↓
I want ADTs
↓
I want Maybe
↓
I want map
↓
I need shared traits
↓
F<_> appears
↓
Monad exists
↓
...wait, where is compose?
```

That messier path is more interesting to me.

It shows which abstractions were pulled into the language by actual pressure and which basic tool only became visible once later abstractions needed it.

## Finished languages hide their construction order very well

Open a specification after the fact and everything looks inevitable.

`compose` is in the Prelude.

Functor refers to composition.

Monad extends Applicative.

The hierarchy looks intentionally laid out from day one.

But it was not.

The clean graph is the result.

The weird sequence is the development history.

Both are true.

And I think the weird sequence says more about the person building the language.

## You can try both styles in the Playground

The basic composition example is:

```rust
fn double value: Int -> Int = value * 2
fn label value: Int -> String = `value: ${value}`

let render = compose label double

pub effect fn main =
  21
  |> render
  |> println
```

https://seseragi.vercel.app/

Then remove `compose` and write:

```rust
pub effect fn main =
  21
  |> double
  |> label
  |> println
```

Neither is the "more functional" answer I want users to prefer by default.

They emphasize different things.

One constructs a reusable function.

The other makes a particular value flow visible.

The funny part is only that Seseragi learned the difference **after it already had Monad**.

That ordering is terrible.

I hope the language keeps producing stories like that.