---
title: "JsonEncode Deriving Isn't Implemented Yet, and the Design Is Already Heavy"
published: false
tags: programming, json, types, seseragi
description: "Automatic codecs sound like boilerplate removal. Then Maybe, Newtype, ADTs, recursion, error paths, and coherence all demand a policy."
series:
main_image:
canonical_url:
---

The first real `std/json` core exists in Seseragi.

JSON can be parsed.

Values can be encoded and decoded.

Records and ADT-shaped JSON can be represented.

So the next desire is painfully obvious:

```rust
struct User deriving JsonEncode, JsonDecode {
  id: Int,
  name: String,
}
```

**Please generate the codecs for me.**

This feature is not implemented on current `main` yet.

And somehow, writing the Issue for it is already one of the heavier design jobs in the JSON work.

## Hand-written codecs stop being cute very quickly

For one tiny type, manual code is fine.

```text
User
```

Then a Web application grows:

```text
User
Session
Profile
Order
ApiError
...
```

Now every type repeats field mapping, constructor tagging, nested decoding, and error handling.

This is why things such as Rust Serde derive are so good from the user's side.

You write:

```rust
#[derive(Serialize, Deserialize)]
```

and move on with your application.

When building the language, though, the question immediately changes from:

> Would automatic codecs be convenient?

Obviously yes.

To:

> **What exactly is the compiler allowed to decide automatically?**

That is where deriving gets heavy.

## "Encode every field" is not a complete contract

A Struct seems easy:

```rust
struct User {
  id: Int,
  name: String,
}
```

Field names become JSON keys.

Done?

Not really.

Very quickly you need answers for:

```text
What does Maybe mean for a field?
Missing vs null?
How is a Newtype represented?
How is an ADT tagged?
Are unknown fields accepted?
Is encoder field order stable?
How is a recursive type derived?
Where does a nested decode error point?
What happens if a manual instance already exists?
```

The boilerplate was hiding policy.

Once the compiler generates the boilerplate, it also has to own the policy.

That is the part I had underestimated.

## Serde looks even more impressive from this side

Rust's Serde has an enormous amount of carefully designed surface around serialization:

- rename
- default
- flatten
- tagged representations
- skipping
- custom codecs
- generic bounds

As a user, that flexibility is fantastic.

As a language designer, it is also a warning about how quickly a "derive JSON" feature can become a serialization language inside the language.

I do not want Seseragi to start there.

The first version should have **one canonical wire format**.

If an application needs something else, an explicit instance/decoder can be the escape hatch.

Convenience can grow later from real requirements.

I would rather begin with a small contract I can keep consistent than a huge annotation system whose interactions I have not earned yet.

## Struct fields use their declaration names

The simplest case should remain unsurprising:

```rust
struct User deriving JsonEncode, JsonDecode {
  id: Int,
  name: String,
}
```

corresponds to a JSON object such as:

```json
{
  "id": 42,
  "name": "Mio"
}
```

No rename annotation in the first design.

No implicit alternate case convention.

The encoder should also use a stable field order.

JSON objects are conceptually unordered for many purposes, but emitted text is observable.

Stable output helps testing and debugging.

So "wire semantics" includes more than whether decoding eventually yields the same Struct.

## ADTs force the language to choose a representation

Consider:

```rust
type Result<A, E> =
  | Ok A
  | Err E
```

There are many possible JSON encodings:

```json
{"tag":"Ok","value":42}
```

or:

```json
{"Ok":42}
```

or any number of other conventions.

Seseragi's core JSON specification already picked a canonical tagged representation:

```text
constructor without payload:
  { "tag": "Name" }

constructor with payload:
  { "tag": "Name", "value": ... }
```

So deriving should reuse that exact contract.

**Deriving is not permission to invent a second wire format.**

That matters because manually written codecs and compiler-generated codecs must not silently disagree about what the same type means on the wire.

## Maybe immediately brings the classic missing-vs-null problem

Web APIs love this distinction:

```text
field is absent
```

versus:

```json
"field": null
```

JavaScript/TypeScript already has both `undefined` and `null` nearby.

PHP has ordinary `null`.

Python has `None`.

Seseragi deliberately does not put `null` into normal value types; absence is represented with `Maybe`.

But the JSON boundary still has to decide what these two wire states mean for `Maybe<A>`.

Collapse both to `Nothing` and information is lost.

Keep them strictly distinct and the API becomes more explicit/heavier.

There is no way for the compiler to "just derive" without making a decision.

That is exactly why I want the default semantics written down before adding lots of annotations.

## Newtype should keep language identity while being wire-transparent

Suppose:

```rust
newtype UserId = Int
```

Inside the program, `UserId` is intentionally not interchangeable with `Int`.

At a JSON boundary, though, I often want:

```json
42
```

not:

```json
{"UserId":42}
```

So the current deriving contract treats Newtype as transparent to the codec of its inner value.

That gives a useful separation:

```text
program type identity
  -> distinct

wire representation
  -> may reuse inner representation
```

The type system does not forget that it is `UserId` just because the codec does not add another JSON wrapper.

I like this example because it makes "type" and "serialization representation" obviously separate axes.

## Error paths have to survive generated code

A nested decoder that only says:

```text
decode failed
```

is not useful enough for real application payloads.

The existing JSON decoder carries structured path information.

If the failure is at something like:

```text
$.user.address.zip
```

I want the generated codec to preserve that path just as carefully as a well-written manual decoder would.

The JSON hotfix immediately before this work even found an `Either` unknown-tag path being reset to the root.

I wrote about that here:

https://dev.to/kentaromorishita/json-worked-then-1e1000000000-found-a-hole-in-my-int-decoder

The deriving implementation must build on the repaired path-aware primitives rather than generate simpler-but-worse errors.

Automatic code should be **more consistent** than hand-written code, not less informative.

## That is why a hotfix interrupted this feature

The deriving work is tracked in:

https://github.com/KentaroMorishita/seseragi/issues/293

As of this draft, #293 is still open.

It explicitly depends on this JSON runtime hotfix:

https://github.com/KentaroMorishita/seseragi/issues/392

#392 is also still open.

The reason for pausing is straightforward: deriving will massively increase the number of types going through the codec/runtime seam.

If exact Int handling, Record complexity, or error-path semantics are already wrong there, compiler generation will spread those mistakes everywhere faster.

So the correct sequence is:

```text
JSON core
↓
review
↓
repair core contracts
↓
then derive on top
```

The feature got delayed because its foundation became more important, not less.

## Manual instances create a coherence problem

Suppose a user already writes an explicit:

```text
JsonEncode<User>
```

Then the compiler sees:

```rust
struct User deriving JsonEncode { ... }
```

What should happen?

Generating a second competing instance is not acceptable.

Silently ignoring the manual one would be worse.

The current contract says deriving and explicit instances must not create ambiguous duplicate evidence.

This connects JSON deriving directly to the same trait/instance coherence machinery used elsewhere in the language.

Serialization is no longer "just code generation."

It is part of generic instance resolution and module semantics.

## Generic Structs mean deriving has to generate constraints too

Consider:

```rust
struct Box<A> deriving JsonEncode, JsonDecode {
  value: A,
}
```

The generated codec cannot encode arbitrary `A` out of thin air.

It needs:

```text
JsonEncode<A>
JsonDecode<A>
```

So deriving has to infer and attach the correct generic constraints.

Seseragi already has similar infrastructure for Show/Debug deriving.

#293 deliberately says to reuse/generalize that machinery instead of building a JSON-only deriving engine.

That is a pattern I care about throughout the compiler:

**A new convenience surface should reuse the existing semantic system if it means the same thing.**

## Recursive types arrive immediately too

Something like:

```rust
struct Node deriving JsonEncode, JsonDecode {
  value: Int,
  next: Maybe<Node>,
}
```

requires recursive codec evidence.

Now generated-helper registration order matters.

Productive recursive ADTs need to work.

Nonsensical/non-productive alias cycles need to be rejected.

Again, the visible syntax is only:

```text
deriving JsonEncode, JsonDecode
```

and the compiler work underneath reaches surprisingly far into type/evidence/codegen infrastructure.

## The Issue is already long before the implementation starts

#293 covers:

```text
Struct
ADT
Newtype
generics
recursion
module boundaries
coherence
error paths
wire order
missing/unknown field behavior
```

and explicitly excludes a bunch of seductive extras such as Serde-style rename/flatten/default annotations.

That length is useful in an AI-heavy project.

"Implement JSON deriving nicely" would almost certainly produce something impressive.

It might also produce a different wire format, different conflict behavior, or a miniature annotation language I never wanted.

The Issue is where I fix the meaning before asking an agent to make the code fast.

## This is not Playground-ready yet

At the moment, this is still target syntax:

```rust
struct User deriving JsonEncode, JsonDecode {
  id: Int,
  name: String,
}
```

not something I want to claim works on current `main`.

#293 remains open and is waiting on #392.

The interesting part right now is the design pressure before implementation:

```text
I want to remove codec boilerplate
↓
which means the compiler must own a wire policy
↓
which means type classes, recursion, error paths, and module boundaries all show up
```

After it is finished, the user experience should become boring:

> Add `deriving`.

Good.

But getting to that boring line requires deciding a surprising amount of meaning first.