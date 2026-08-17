---
title: "My Language Was Missing an Operator, So I Wrote It in the Language"
published: false
tags: programming, compilers, functional, seseragi
description: "Custom operators started as userland flexibility. Then I used one to prototype a missing built-in language feature before touching the compiler."
series:
main_image:
canonical_url:
---

When you are building your own programming language, there is an obvious answer to this sentence:

> I wish the language had this operator.

You open the compiler and add one.

Seseragi already uses operators such as `|>` and `$` heavily, so I have had plenty of opportunities to think about that.

But I did not want every useful symbolic operation to become another permanent entry in a compiler-owned table.

So Seseragi also has user-defined infix operators.

That feature became much more interesting when I accidentally used it to prototype a language feature I had forgotten to implement.

## A custom operator is mostly a function plus reading rules

Seseragi can define a top-level infix operator like this:

```rust
pub operator<A> infixr 5 <+>
  left: A -> right: A -> A
where Semigroup<A> =
  append left right
```

The declaration provides several things together:

```text
symbol
fixity
precedence
type
body
```

The expression:

```rust
left <+> right
```

can then behave like an ordinary curried function application:

```text
(<+>) left right
```

The operator is not a second execution model.

It is closer to a function name made from punctuation, plus enough fixity information for the parser to know how to group the expression.

That distinction matters a lot.

If an operator's meaning really is ordinary function application, the compiler does not need to understand the domain meaning of every symbol users invent.

## Haskell makes this idea feel very natural

Haskell treats symbolic operators as extremely normal function-like values.

Fixity declarations can specify how they associate and bind:

```haskell
infixr 5 <+>
```

Seseragi's model is philosophically close to that.

The operator symbol is not magic merely because it is punctuation.

The reading rules are explicit.

The type is explicit.

The body is ordinary language code.

By contrast, TypeScript does not let userland introduce completely new operator symbols.

Rust and Python let types participate in the meaning of existing operators through traits or special methods, but they do not generally let a library invent a brand-new infix punctuation sequence and assign its own precedence.

Those are very different answers to the same question:

**How much of the language's notation should user code be allowed to own?**

Seseragi opens that door farther than many mainstream languages.

Not because I think more syntax is always better, but because I did not want domain-specific symbolic functions to require compiler patches.

## Then I discovered List cons was missing

Seseragi has a persistent `List`.

The specification says the real cons operator should be:

```rust
1 : 2 : 3 : `[]
```

with right associativity and the type:

```text
A : List<A> -> List<A>
```

There was only one problem.

I had forgotten to wire the built-in `:` into the current compiler.

That gap is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/298

The single `:` symbol is reserved, so userland cannot redefine it directly.

Custom operator symbols also have to be at least two characters.

But for a prototype, `::` is close enough.

## So I wrote a fake cons operator in Seseragi

Here is the experiment:

```rust
import * as lists from "std/list"

operator infixr 4 ::
  head: Int -> tail: List<Int> -> List<Int> =
  lists.append tail `[head]

let values: List<Int> = 1 :: 2 :: 3 :: `[]

pub effect fn main =
  println $ `List: ${values}`
```

Because the operator is declared `infixr`, the chain reads as:

```text
1 :: (2 :: (3 :: `[]))
```

I pasted it into the Playground.

It worked.

That was the moment the custom-operator feature changed meaning for me.

I was no longer just giving library authors expressive notation.

I had used Seseragi itself as a prototyping environment for Seseragi's language design.

## Normally I would have had to touch half the compiler first

A real new built-in operator can involve:

```text
scanner
parser
fixity resolution
type checking
lowering
runtime
formatter
analysis
reference docs
```

If all I want to answer is:

> Does a right-associative cons-like operator read well here?

that is a ridiculous amount of infrastructure to change before I can even feel the syntax.

The custom operator let me test the surface first.

It did not prove the final implementation.

It did something more modest and very useful:

**It let me experience the language idea before committing compiler architecture to it.**

That is a very different feedback loop.

## The prototype is intentionally not the real implementation

The fake `::` above uses:

```rust
lists.append tail `[head]
```

That is enough to produce the expected values for a small experiment.

It does not guarantee the real List cons performance contract.

The built-in `:` is supposed to connect directly to the persistent linked-list representation and add a head in constant time.

So the prototype answers questions about notation and composition.

The built-in implementation answers questions about the language contract.

Those should not be confused.

This is actually one of the things I like about prototyping the feature in userland: the boundary becomes obvious.

A surface can be pleasant while still being semantically incomplete.

## If custom operators work, why have built-ins at all?

This was the next obvious question.

If symbolic operations can be defined as normal functions, maybe almost every operator should be user-defined.

That idea breaks very quickly.

Consider Maybe fallback:

```rust
cachedName ?? requestedName ?? "anonymous"
```

Seseragi specifies `??` as a right-associative short-circuiting operator.

If the left side is `Just`, the right side must not be evaluated.

The implementation gap for that operator is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/343

A normal custom operator cannot reproduce that semantics if ordinary operands are evaluated before the function-like operator body runs.

The same issue appears with logical short-circuit operators such as `&&` and `||`.

So custom operators immediately revealed a useful boundary.

## Some operators are functions. Some operators are control flow.

The current Seseragi specification makes ordinary custom infix operators function-like.

It also reserves built-ins whose semantics require the language itself to participate.

That gives me a rough rule:

```text
ordinary curried function semantics
  -> can live in userland

evaluation strategy / short-circuit / special runtime contract
  -> belongs to the language
```

That is not a mathematically perfect categorization of every possible operator.

But it is much more concrete than the vague rule I started with.

Actually trying to use custom operators forced me to ask what the compiler needs to know and what it can safely ignore.

## The current specification puts real constraints on custom operators

Seseragi does not make operator syntax completely free-form.

The specification gives custom operators explicit constraints.

They are binary infix operators only.

The fixity can be:

```text
infixl
infixr
infix
```

where `infix` means non-associative.

Precedence is an integer from 0 through 8.

The operator symbol must use allowed ASCII operator characters and contain at least two characters.

Several language-owned forms are reserved, including:

```text
->
<-
..
...
??
:=
```

and the standard operators.

Some punctuation combinations that collide with generic delimiters are rejected too.

The important idea is that userland gets freedom **inside a grammar contract**.

I do not want a macro system where arbitrary punctuation can rewrite arbitrary syntax.

I want a typed infix function with an explicit reading rule.

## Operator namespace is separate from value namespace

Another detail I like is that operators are imported explicitly as operators.

For example:

```rust
import { operator <+> } from "./semigroup"
```

That keeps symbolic names visible at the module boundary.

If two imported operators introduce the same symbol into scope, that should become an ambiguity rather than silently picking one.

This matters because custom operators can damage readability much faster than ordinary function names if their origin is mysterious.

Giving them freedom does not mean making them invisible.

The language still has to help the reader answer:

```text
Where did this symbol come from?
How tightly does it bind?
Which direction does it associate?
What is its type?
```

## Go represents the opposite design instinct, and I understand it

Go mostly refuses this entire category of customization.

You cannot fill a codebase with domain-specific operator punctuation.

That protects readers from having to learn a local symbolic dialect.

There is a lot to like about that.

Seseragi makes a different tradeoff.

If an operation really behaves like a typed function and its fixity is declared, I am willing to let a library give it symbolic notation.

That does not mean every library should.

Language capability and style recommendation are separate things.

I want the core compiler to stay small without forcing every domain operation to use an alphanumeric function name forever.

The cost is that user code has more expressive power and therefore more responsibility.

## The best part was that unrelated features composed

I did not implement custom operators specifically to solve List cons.

I did not implement right associativity specifically for this prototype.

I did not implement first-class curried functions specifically so the operator could be referenced as a value.

Those pieces existed for their own reasons.

Then this combination appeared:

```text
persistent List
+
custom operator
+
right associativity
+
ordinary function semantics
```

and I could sketch a missing language feature without touching the compiler first.

That kind of accidental composition is one of the strongest signals I get while building Seseragi.

It suggests the features are not merely sitting next to each other.

They are actually participating in the same model.

I wrote about that broader feeling here too:

https://dev.to/kentaromorishita/the-best-feeling-is-when-ordinary-features-compose-into-something-bigger-17cn

## Try the prototype in the Playground

The custom `::` example is ordinary working Seseragi code today:

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

The real built-in `:` is still waiting on #298, so do not confuse this with the final List implementation.

But that is exactly why the example is interesting to me.

The language is incomplete.

And instead of immediately opening the compiler, I could ask the incomplete language to help design its own missing piece.

> The language does not have the operator I want.
>
> Fine.
>
> Can the language write it itself first?

This time, the answer was yes.