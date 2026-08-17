---
title: "I Built a Persistent List and Somehow Forgot the Cons Operator"
published: false
tags: programming, compilers, functional, seseragi
description: "The List existed. Literals existed. Patterns existed. Monad support existed. Then I noticed I had forgotten the most List-shaped operation of all."
series:
main_image:
canonical_url:
---

Programming-language development has a very specific kind of embarrassment.

You can spend weeks building something complicated, then discover that one incredibly obvious piece is missing.

That happened to me with `List`.

Seseragi already had a persistent List type:

```rust
let values: List<Int> = `[1, 2, 3]
```

It had List patterns:

```rust
fn describe values: List<Int> -> String = match values {
  `[] -> "empty"
  `[head, ...tail] -> `head: ${head} / tail: ${tail}`
}
```

It had standard instances and enough surrounding machinery that List felt like a real part of the language.

Then one day I had a very basic thought:

**How do I add one element to the front?**

## The specification already had the answer

Seseragi's List is designed as a persistent linked list.

So of course it needs cons.

The specification says the built-in operator should be:

```rust
head : tail
```

A chain such as:

```rust
1 : 2 : 3 : `[]
```

is right-associative:

```text
1 : (2 : (3 : `[]))
```

The type is:

```text
A : List<A> -> List<A>
```

and the operation is supposed to construct a new head node in constant time.

Great.

So I tried to use it.

It did not work.

## Haskell makes this omission look especially ridiculous

In Haskell, List and cons are almost impossible to mentally separate:

```haskell
1 : 2 : 3 : []
```

And the same recursive shape appears in patterns:

```haskell
x : xs
```

Once you think of a List as:

```text
Empty
or
Cons head tail
```

cons is not some optional utility method.

It is basically the constructor-shaped operation of the data structure.

ML-family languages often make the same idea extremely visible with `::`.

So the strange part in Seseragi was not that I eventually wanted cons.

The strange part was the order in which everything arrived.

List literal? Done.

List pattern? Done.

Monad-related machinery? Done.

Actual built-in cons operator?

Forgotten.

The neighborhood grew before I built the front door.

## My Web background probably helped me forget it

This is also a useful reminder that language design does not happen in a vacuum.

In TypeScript, I rarely think in terms of persistent linked-list cons.

If I want a new sequence with something at the front, I might write:

```ts
const values = [head, ...tail]
```

or use other Array operations.

Python has a similarly familiar list-centric world:

```python
values = [head, *tail]
```

Go code usually reaches for slices.

The operation "put one item at the front" exists in all of these ecosystems, but it is not normally presented as the defining constant-time operation of a persistent linked list.

I have spent most of my career in that world.

So it is funny that I could deliberately add a persistent List to Seseragi while still carrying enough Array-shaped instinct to leave cons unwired.

The missing feature exposed a mismatch in my own mental model.

## The spec existed. The compiler connection did not.

The actual state was basically:

```text
write the List specification
↓
implement List
↓
implement List literals
↓
implement List patterns
↓
forget to wire the cons operator
```

That gap is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/298

As of this draft, #298 is still open.

The issue is broader than adding a token to the parser.

A real built-in `:` has to carry the full contract:

- reserved built-in symbol
- right associativity
- `A : List<A> -> List<A>` typing
- useful diagnostics for mismatched head/tail types
- Typed HIR and Core IR lowering
- the existing persistent runtime representation
- constant-time cons behavior
- formatter stability
- analysis, highlighting, and reference surfaces
- CLI and Playground execution

Once again, one character manages to visit most of the language implementation.

## Then I remembered Seseragi already has custom operators

Before fixing the compiler, another thought occurred to me.

Seseragi lets user code define infix operators.

The real single `:` is reserved, so I cannot steal it.

Custom operator symbols also have to be at least two characters.

But if I only want to test the **feel** of the operation, why not use `::`?

For an Int-only prototype:

```rust
import * as lists from "std/list"

operator infixr 4 ::
  head: Int -> tail: List<Int> -> List<Int> =
  lists.append tail `[head]

let values: List<Int> = 1 :: 2 :: 3 :: `[]

pub effect fn main =
  println $ `List: ${values}`
```

Because the operator is declared `infixr`, it parses as:

```text
1 :: (2 :: (3 :: `[]))
```

I pasted it into the Playground.

It worked.

My reaction was basically: **wait, you can already do that?**

## It is not real cons, and that distinction matters

The `::` prototype is deliberately not presented as the final implementation.

It uses `lists.append` to fake the surface behavior.

That means it does **not** automatically inherit the real cons performance contract.

The built-in operation should create a head node in constant time against Seseragi's actual persistent List representation.

The prototype only answers questions such as:

```text
Does right-associative cons-like syntax feel natural here?
Does this read the way I expect?
How does it compose with the existing List literal?
```

That is still extremely useful.

I can test a language-design idea before finishing the language implementation behind it.

## This is where custom operators became more interesting than I expected

When I added custom operators, I mostly thought of them as a way to let userland introduce domain-specific notation without bloating the compiler's built-in operator table.

I did not think:

> One day I will use this to prototype a missing language feature in the language itself.

But that is exactly what happened.

I had:

```text
List
+
custom infix operators
+
right associativity
+
ordinary curried functions
```

and those existing pieces were enough to build a convincing surface experiment.

That is one of my favorite kinds of success in Seseragi.

Not "I added another special feature."

More like:

**Several ordinary features were already composable enough that the missing thing could be sketched from inside the language.**

## This looks like Haskell or ML, but the route there was backwards

The syntax is obviously familiar if you know Haskell or ML-family languages.

There is no interesting claim to make that cons notation is novel.

What I find interesting is the route by which I arrived at it.

It was not:

```text
Haskell has cons
↓
copy Haskell's List feature checklist
```

It was more like:

```text
build List
↓
use List
↓
want to add a head
↓
notice the spec already defines cons
↓
notice the compiler forgot it
↓
prototype the feel with a custom operator
```

Existing languages already tell us that this operation is natural for linked lists.

But there is something different about running into the same answer by using your own half-finished language and discovering the missing piece yourself.

You get the very strong feeling of:

**Ah. Right. Of course this data structure wants this operation.**

## A prototype being possible does not mean the operator should stay userland-only

At this point there is an obvious question:

If `::` can be written as a custom operator, why bother implementing built-in `:` at all?

Because those are two different guarantees.

A userland prototype says:

```text
I can express something with roughly this surface.
```

A built-in List cons says:

```text
this operation is part of the language's standard List semantics
```

The built-in version should be polymorphic:

```text
A : List<A> -> List<A>
```

It should connect directly to the canonical List runtime representation.

It should guarantee the constant-time operation the data structure promises.

The formatter and tooling should know it as a reserved operator.

The reference should document it.

So "I can fake the syntax in userland" is not the same as "the language contract is complete."

That distinction became much clearer after I actually tried the prototype.

## It also helped clarify what belongs in userland and what belongs in the language

Some operators can be modeled as ordinary functions plus fixity information.

Those are good candidates for custom operators.

Other operators need special evaluation semantics or deep runtime guarantees.

Those are stronger candidates for built-ins.

List cons sits in an interesting middle position.

Its **surface shape** is easy to prototype as an ordinary operator.

But its standard persistent-List representation and performance contract are important enough that Seseragi still treats the real `:` as a built-in.

The Maybe fallback operator `??` is even more clearly language-owned because its right operand must short-circuit.

Using custom operators in practice made these boundaries much easier to reason about than writing an abstract rule in advance.

## The real `:` still does not compile yet

This is important if you want to try the code.

As of this draft:

```rust
let values: List<Int> = 1 : 2 : 3 : `[]
```

is still specification code, not a working normal source example.

Issue #298 is open.

If you want to experiment in the current Playground, use the `::` prototype instead:

```rust
import * as lists from "std/list"

operator infixr 4 ::
  head: Int -> tail: List<Int> -> List<Int> =
  lists.append tail `[head]

let values: List<Int> = 1 :: 2 :: 3 :: `[]

pub effect fn main =
  println $ `List: ${values}`
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

The ordinary List itself already works:

```rust
let values: List<Int> = `[1, 2, 3]
```

So there is currently this funny gap where the data structure exists, the specification exists, and a userland imitation works, while the canonical one-character surface is still waiting for its compiler connection.

If I waited until everything was finished, the final documentation would say:

> Lists support the `:` cons operator.

Technically correct.

Much less fun than the real sequence:

> I built List.
>
> I built its patterns.
>
> I wrote its specification.
>
> I forgot cons.
>
> Then I realized the language could prototype its own missing operator.

That is the version I want to remember.