---
title: "JSON Worked. Then 1e1000000000 Found a Hole in My Int Decoder."
published: false
tags: programming, json, compilers, seseragi
description: "The JSON core had already merged. Then an extreme exponent exposed a seam where exact parsing could still blow up before returning the typed error I wanted."
series:
main_image:
canonical_url:
---

I had just merged the first real `std/json` core into Seseragi.

Parsing worked.

Encoding and decoding worked.

The next task was obvious: derive `JsonEncode` and `JsonDecode` for Structs and ADTs.

Then I reread the implementation and got a hotfix instead.

**JSON worked. But the boundary from an exact JSON number to Seseragi `Int` had a slightly terrifying path.**

## What should happen to `1e1000000000`?

This is valid JSON:

```json
1e1000000000
```

Seseragi `Int` is a safe integer type, so this value obviously does not fit.

The desired result is boring:

```text
JSON parsed successfully
↓
Int decoder checks the value
↓
typed decode failure: outside Int range
```

The problem was what happened before that final range check.

The JSON parser preserves numbers in an exact Decimal-shaped representation.

But one Int-decoding path converted that Decimal into a normal decimal string before checking whether it fit in a safe integer.

For an absurd exponent, that can conceptually mean trying to construct:

```text
1 followed by one billion zeroes
```

just so the decoder can eventually say:

> Sorry, this does not fit in Int.

No. We can know that much earlier.

## Exact parsing was the right decision. The conversion path was not.

Seseragi's first formal backend is TypeScript, so the easiest JSON implementation would have been to treat JavaScript `JSON.parse` and `Number` as the language's numeric semantics.

That is attractive because the host already does everything.

It also means JSON numbers immediately collapse into IEEE-754 double precision.

For example, values beyond JavaScript's safe integer range stop behaving like exact integers.

That is normal in JavaScript.

I did not want it to become the definition of Seseragi JSON.

So the parser keeps an exact representation first, and the **target decoder** decides whether that JSON number can become:

```text
Int
Float
Decimal
...
```

I still like that architecture.

The hotfix existed because one edge of the implementation temporarily betrayed it.

## Python and Go make the host-choice question visible too

Python's standard JSON parser can read integer literals into arbitrary-precision Python `int` values.

Go's `encoding/json`, when decoding into an untyped interface in the usual way, commonly uses `float64`, though `UseNumber` lets callers delay that conversion and interpret the textual number later.

So even mature ecosystems make different choices about **when** a JSON number gets committed to a host numeric type.

Seseragi's answer is:

```text
parse exactly first
↓
decode to a language type second
```

The point is not to be mathematically fancy.

It is to avoid letting the TypeScript backend decide what integers the Seseragi language can distinguish.

## Range checking should happen on the compact representation

The fix direction is straightforward.

The Decimal representation already has enough structure:

```text
sign
digits
scale
```

From that, the decoder can determine:

- whether the value is integral
- whether it fits the safe `Int` range
- whether it is zero

without first materializing a gigantic canonical decimal string.

Only after the value is known to fit should the implementation perform whatever small conversion is required.

The desired cases are explicit:

```text
9007199254740991   -> success
9007199254740992   -> safe-range failure
1.5                -> expected-integer failure
1e1000000000       -> range failure without huge expansion
```

The important part is not the wording of the error.

It is that an invalid language-level value stays a **typed decode failure** instead of escaping as host OOM, `RangeError`, or some other defect.

## If you call the parser exact, the boundary has to stay exact too

This bug clarified something for me.

It is easy to advertise:

> JSON numbers are parsed exactly.

But that promise is only meaningful if the next conversion step preserves the same discipline.

Otherwise the architecture becomes:

```text
exact parser
↓
host-shaped shortcut
↓
typed Seseragi failure again
```

Normal values never expose that seam.

Extreme values do.

Compiler/runtime boundaries are full of these places where a design looks coherent until an adversarial input touches the join.

The boring edge case is often where the architecture tells the truth.

## The same review found two unrelated-but-related holes

While looking through the JSON runtime, I found two more issues.

The first was structural Record decoding.

The implementation searched the input object for every expected field separately.

That means a record with `n` fields can drift toward `O(n²)` lookup behavior.

The specification expects the standard codec path to remain linear with input/output size.

So the fix should build a lookup once or otherwise use a single-pass strategy instead of repeating searches.

Nothing is semantically wrong with the successful result.

The implementation simply becomes unnecessarily expensive as the structure grows.

The second issue was error-path metadata for `Either`.

Given an unknown constructor tag such as:

```json
{"tag":"Unknown"}
```

the decoder correctly knew the failure kind was `UnknownJsonTag`.

But it recreated the error at the root, losing the fact that the failure happened at the `tag` field.

I want the path to remain:

```text
[JsonField("tag")]
```

not:

```text
[]
```

## Typed errors are not enough if they throw away location

A decoder returning a structured error is already better than throwing a vague exception.

But in real Web payloads, this:

```text
decode failed
```

is still weak.

If the actual failure is buried under something like:

```text
$.user.address.zip
```

that path is part of the useful information.

Schema validators in TypeScript, Python validation libraries, and practical codec systems all end up caring about this for the same reason.

Seseragi's JSON decoder is intended to preserve:

```text
innermost error kind
+
path from root to the failing value
```

So losing the `tag` location is not merely worse developer experience.

It means the structured error contract is incomplete.

## The hotfix interrupted the next feature on purpose

The three bugs are tracked together in:

https://github.com/KentaroMorishita/seseragi/issues/392

As of this draft, #392 is still open.

The timing is important.

The next planned work is nominal JSON deriving:

https://github.com/KentaroMorishita/seseragi/issues/293

And deriving will reuse the same codec/runtime seam.

If I continued immediately, I would be multiplying the reach of behavior I already knew was slightly wrong.

So the sequence changed from:

```text
#292 JSON core
↓
#293 deriving
```

to:

```text
#292 JSON core
↓
post-merge review
↓
#392 hotfix
↓
#293 deriving
```

That interruption is the feature of this story.

## AI makes "stop here" more important, not less

A lot of Seseragi implementation work is done with AI agents.

That makes it very easy to keep moving.

Issue closes.

Next Issue starts.

Another large feature appears quickly.

The dangerous rhythm is:

```text
it passed
↓
next
↓
it passed
↓
next
```

#292 had already merged.

CI was green.

The feature worked for normal examples.

The problems appeared because I stopped and reviewed a supposedly completed layer before building on top of it.

Faster implementation increases the value of explicit stopping points.

Otherwise small architectural seams get amplified faster too.

## A green feature still deserves suspicion

The later a system gets, the less often bugs look like:

```text
nothing works at all
```

They move toward:

- extreme values
- algorithmic complexity
- error metadata
- resource lifetime
- cross-module identity

Those are exactly the places normal happy-path fixtures may not exercise.

So "merged and green" is a milestone.

It is not a proof that the design contract survived every boundary.

## This article is not a completed-hotfix announcement

At the moment I am writing this, #392 is still open.

The JSON core exists.

The issue is specifically repairing these edge contracts before the deriving work continues.

That means this is a snapshot of the development sequence rather than polished reference documentation.

Eventually the JSON docs should simply say:

> Invalid numbers produce typed decode failures and preserve exactness/path semantics.

Good.

But I also want to remember the less elegant version:

> JSON works!
>
> Wait, what happens if the exponent is one billion?
>
> ...oh no.

That moment taught me more about the meaning of "exact" than the feature checklist did.

**Exact is not a parser label. It is a promise you have to keep all the way to the boundary.**