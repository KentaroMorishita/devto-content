---
title: "If Records Already Have Fields, Why Does My Language Need Structs Too?"
published: false
tags: programming, types, typescript, seseragi
description: "Structural records are great when shape is enough. Nominal structs are great when meaning matters. I ended up wanting both."
series:
main_image:
canonical_url:
---

Once Seseragi could represent structured data, Records were an obvious feature to want.

For example:

```rust
let profile: { name: String, role: String } =
  { name: "Mio", role: "Engineer" }
```

That is straightforward.

The value has two fields, so the type describes two fields.

Then I added `struct` and had to ask myself a very reasonable question:

**Why do I need both?**

They look almost the same.

The answer ended up being less about syntax and more about whether I care about **shape** or **identity**.

## A Record says: this shape is enough

Seseragi Records are structurally typed.

If a function only needs a `name`, it can say exactly that:

```rust
fn nameOf value: { name: String } -> String =
  value.name
```

A value can contain more fields and still satisfy the requirement:

```rust
let user = {
  id: 1,
  name: "Aki"
}

let name = nameOf user
```

`nameOf` does not care what the value is called.

It does not care whether the object came from a User API, a profile form, or a local helper.

It only requires:

```text
name: String
```

That is where structural typing feels great.

The function describes exactly the information it consumes and nothing more.

## This is the TypeScript instinct I absolutely wanted to keep

TypeScript makes this style feel extremely natural:

```ts
type Named = { name: string }

const nameOf = (value: Named) => value.name

nameOf({ id: 1, name: "Aki" })
```

For Web application code, this is incredibly convenient.

A helper can ask for a small shape without forcing every caller into the same nominal hierarchy.

An API response can have twenty fields while a function only depends on two.

I have complaints about how far TypeScript's flexibility can go, but this part is useful enough that I did not want to throw it away just because Seseragi has stronger nominal types elsewhere.

I wrote about the broader TypeScript tradeoff here:

https://dev.to/kentaromorishita/typescript-can-express-almost-anything-thats-part-of-the-problem-28je

Records are one of the places where I still strongly sympathize with the structural model.

## But sometimes the same shape absolutely should not mean the same type

Now imagine a domain value:

```rust
struct Profile {
  name: String,
  role: String
}

let profile = Profile {
  name: "Mio",
  role: "Engineer"
}
```

Then someone defines:

```rust
struct Account {
  name: String,
  role: String
}
```

The fields happen to match perfectly.

I still do not want `Profile` and `Account` to become the same type.

Their shapes are the same.

Their meanings are not.

That distinction was the reason Struct survived even after Record existed.

## Rust makes the nominal side easy to understand

Rust `struct` types are nominal.

Two structs with identical fields are still different types because the type name is part of their identity.

That is extremely useful for domain modeling.

The same instinct shows up when people separate `UserId` from `OrderId` even if both use integers internally.

Shape is not always the important information.

Sometimes the important information is:

```text
this value belongs to this domain concept
```

Seseragi's Struct lives on that side of the line.

What surprised me is that I did not end up choosing between the TypeScript-like structural approach and the Rust-like nominal one.

I wanted both because they solve different problems.

## Record and Struct answer different questions

The mental model I ended up with is roughly:

```text
Record
  -> Does this value have the shape I need?

Struct
  -> Is this value specifically this domain type?
```

That sounds almost too obvious.

But it prevents a lot of feature-ranking discussions that were not useful to me.

Struct is not "a stronger Record."

Record is not "a lighter Struct."

They represent different intentions.

If every little local data bundle becomes a named Struct, the code accumulates names that do not carry much meaning.

If every domain entity becomes a structural Record, semantically distinct values can start mixing because their fields happen to line up.

So Seseragi keeps both choices visible.

## Struct does not silently turn into an equivalent Record

This is an important boundary.

Even if a Struct has exactly the fields required by some Record shape, Seseragi does not automatically erase its nominal identity and treat it as that Record.

At first glance, that can feel strict.

TypeScript trains you to appreciate the convenience of "if the shape matches, let it through."

But once I deliberately created a nominal type, I did not want another part of the language to casually pretend the name never mattered.

If conversion between a nominal Struct and a structural Record is desired, I prefer that boundary to be explicit rather than magical.

Otherwise the distinction becomes decorative.

## This stopped being philosophy as soon as modules got involved

The Record/Struct distinction sounds like a language-design essay until the compiler gets the type identity wrong.

Then it becomes a bug very quickly.

I hit one while splitting a Web application into modules.

I wanted a public Struct containing an imported generic nominal type:

```rust
import * as signals from "std/signal"

pub struct AppContext {
  count: signals.Signal<Int>,
  increment: Task<Unit>,
}
```

The field was supposed to remain canonically `Signal<Int>` when the Struct crossed the module interface.

Instead, one compiler path lost enough nominal identity that downstream code no longer considered the field's type identical to the canonical imported `Signal<Int>`.

The frustrating workaround was to replace the Struct with a structural Record alias.

That worked.

Which is almost a perfect bug for an article about why these two kinds of types are different.

The regression was tracked here:

https://github.com/KentaroMorishita/seseragi/issues/243

## The workaround succeeding was actually evidence of the bug

The Record-alias version looked like:

```rust
pub alias AppContext = {
  count: signals.Signal<Int>,
  increment: Task<Unit>,
}
```

If that crosses the module boundary correctly while the nominal Struct does not, the problem is not `Signal` itself.

It means the compiler is preserving structural field information through one path while mishandling canonical nominal identity through another.

That is exactly the kind of distinction the language claims to care about.

So the implementation has to care too.

Issue #243 has since been closed as completed.

The completion criteria explicitly required imported generic nominal types, nested generics, qualified/unqualified spelling, and user-defined nominal types to retain the same canonical identity across module-interface round trips.

That is the real cost of saying a Struct is nominal.

You cannot just write a type name in the syntax.

You have to protect that identity all the way through the compiler.

## "Nominal" is an end-to-end promise

This was the part I understood better after the bug.

A nominal type is not nominal because the parser saw:

```rust
struct Profile { ... }
```

It is nominal if every later layer still knows that this value is a `Profile` and not merely a bag of fields with a compatible shape.

That means:

- module interfaces
- serialized type information
- imported generic arguments
- field access
- downstream function calls
- analysis and diagnostics

all have to agree on identity.

The user sees one name.

The compiler has to keep that name meaningful across every boundary.

## TypeScript and Rust both influenced the answer, but neither won

If I had copied TypeScript's instincts everywhere, Records could probably do almost all structured-data work.

If I had copied Rust's instincts everywhere, I could make named Structs the dominant product type and require explicit types more often.

I did not want either extreme.

Seseragi's answer is basically:

```text
Structural shape is valuable.
Nominal identity is valuable.
Do not pretend they are the same question.
```

That is less elegant than saying "the language has one unified data-object model."

It is also more honest about the different things I want to express in application code.

## Try creating two identical Structs

The Playground and Tour include Struct examples:

```rust
struct Profile {
  name: String,
  role: String
}

let profile = Profile {
  name: "Mio",
  role: "Engineer"
}

pub effect fn main =
  println $ `${profile.name}: ${profile.role}`
```

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

Now add:

```rust
struct Account {
  name: String,
  role: String
}
```

and write a function that specifically accepts `Profile`.

Passing an `Account` should fail even though every field has the same name and type.

That failure is the feature.

Then compare that with a function accepting a structural Record such as:

```rust
{ name: String }
```

That is the difference I wanted the language to preserve.

**Sometimes shape is the contract. Sometimes the name is the contract.**

Record and Struct both exist because I did not want to lose either sentence.