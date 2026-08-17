---
title: "The HTTP Engine Exists. The API Surface Is Still Thin."
published: false
tags: programming, webdev, api, seseragi
description: "A provider can already send HTTP. The spec already defines the richer API. The unfinished part is wiring that meaning all the way to ordinary source code."
series:
main_image:
canonical_url:
---

Seseragi's HTTP client is no longer zero.

There is an execution path in the provider/runtime layer.

There is a minimal `std/http` surface.

So it is tempting to say:

> HTTP works.

Then you try to write a completely ordinary Web API request and discover that the public surface is still thin.

This is a recurring state in language development:

**The inside exists. The front door does not yet expose all of it.**

## What I want first is extremely boring HTTP

Before streaming, WebSockets, SSE, or anything fancy, I want this:

```text
GET / POST / etc.
URL
headers
Bytes body
↓
status
response headers
response Bytes
```

A normal request.

A small response.

Typed failure.

That should be enough for a huge amount of ordinary application code.

The current implementation work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/295

As of this draft, #295 is still open.

## The specification is already ahead of the public module

The normative library design includes types and operations around:

```text
Method
Status
Headers
HttpUrl
Request
Response
HttpBodyLimit
```

plus request construction, header manipulation, `sendBytes`, `sendEmpty`, and safe access to the response pieces.

The currently wired `std/http` is smaller.

So the problem is not primarily inventing an HTTP API from scratch.

It is connecting an already-decided contract vertically:

```text
specification
↓
standard module interface
↓
type checker
↓
Effect / capability evidence
↓
Provider
↓
runtime adapter
↓
CLI / Playground / tooling
```

A standard-library function may look like "just library code" from the outside.

In a compiled language with typed capabilities and generated module interfaces, it can still touch almost every layer.

## TypeScript makes this feel hilariously overengineered for a moment

In ordinary TypeScript:

```ts
const response = await fetch(url)
```

Done.

Python has mature HTTP libraries.

PHP has cURL and ecosystem clients.

Go has `net/http`.

When you are consuming those APIs, many design decisions are already invisible because someone else made them years ago.

Building the language moves those decisions back into your lap:

```text
What is Method?
Who parses URLs?
Is the body String or Bytes?
What is a network failure type?
Do redirects happen automatically?
Where does cancellation live?
```

Suddenly adding `get(url)` without answering the surrounding questions feels suspicious.

I used to consume APIs.

Now I have to decide what an API promises.

That changes your tolerance for shortcuts very quickly.

## The provider engine should not be duplicated just because the public API is growing

One thing #295 is very explicit about is reuse.

There is already an `HttpClient#send` path in the provider layer.

The richer application-facing functions should project onto that existing engine rather than creating another parallel implementation.

Why care so much?

Because duplicate execution paths rot differently.

Browser behavior diverges from Bun.

Cancellation works in one path but not the other.

One network bug is fixed twice.

Error translation starts disagreeing.

The public surface may expand, but the core operation should still converge on one runtime contract.

## I want a thin HTTP core even though convenient clients are nice

It is very tempting to add:

```text
getJson
postJson
timeout
retry
authentication
cookie jar
automatic redirects
```

because those are things real applications want.

The current Seseragi HTTP core deliberately does less.

#295 explicitly keeps several automatic behaviors out:

```text
HTTP -> HTTP
JSON -> std/json
text decoding -> std/text / Bytes conversion
retry / timeout -> Effect-side composition
streaming -> Stream-based API later
```

This is not because convenient helpers are bad.

A userland library can absolutely provide them.

The question is whether the foundational HTTP module should silently own those meanings.

I would rather make the core composable and let convenience grow on top.

## Redirect behavior is a surprisingly good example

Many HTTP clients follow redirects automatically because that is often what applications want.

Seseragi's small-response core intentionally does **not** make automatic redirect-following the hidden default.

That sounds like a tiny policy choice.

It illustrates the larger principle:

**If behavior can materially change what request was made or what response was observed, I prefer not to hide it simply because a host client normally does.**

The runtime can still implement higher-level helpers later.

The core contract should remain obvious.

## Body is `Bytes`, not String

This was another small decision that became important quickly.

If HTTP body is defined as String from day one, binary data becomes the awkward special case later.

So the core representation uses `Bytes`.

Then:

```text
Bytes
↓ optional UTF-8 decoding
String
↓ optional JSON decoding
value
```

is a composition of meanings rather than one HTTP function guessing what the payload is.

Images, protobuf, compressed/binary payloads, files, and arbitrary protocol data stay possible without pretending they are text.

It is an obvious fact about HTTP.

It is also easy to ignore if your first sample happens to be JSON.

## "Specified" and "available" are very different milestones

Before building a language, I think I implicitly treated a specification entry as evidence that a feature existed.

Now I see several separate states:

```text
specified
parsed/represented
published in standard interface
type-checks
lowers
runtime path exists
works in CLI
works in Playground
tooling documents it
```

#295 is largely about moving the HTTP surface through that chain.

The new idea is already written down.

The boring engineering task is making the product agree with the specification.

And until that boring work is done, the user does not actually have the API.

## This is why the current incomplete moment is worth writing down

After #295 closes, the documentation can simply say:

```text
construct a Request
send Bytes
inspect Response status / headers / body
```

That will be more useful as reference material.

It will also hide the weird intermediate state:

```text
provider engine exists
minimal std/http exists
richer contract exists
application surface is still being wired
```

For a development log, the intermediate state is more interesting.

It shows where the actual work is.

Not every missing feature is an undecided design.

Sometimes the design is already there and the remaining job is to make every layer tell the same story.

That is where Seseragi's HTTP client is right now.