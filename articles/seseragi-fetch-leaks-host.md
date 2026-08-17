---
title: "Calling fetch Directly Would Be Faster. It Would Also Leak Everything."
published: false
tags: programming, webdev, architecture, seseragi
description: "TypeScript's closeness to the Web platform is a strength. For Seseragi, exposing that same host surface as language semantics would become a trap."
series:
main_image:
canonical_url:
---

The fastest way to add an HTTP client to a language that targets TypeScript is obvious:

> Just emit `fetch`.

Honestly, for a prototype, that is a great answer.

The browser already has the HTTP stack.

Bun and Node have increasingly Web-compatible APIs too.

Why build another layer?

Then you move the host API one step closer to the public language surface and a parade starts walking through the door:

```text
Request
Response
Headers
Promise
AbortController
DOMException
browser / Node / Bun differences
```

That is when I had the uncomfortable thought:

**If I let this leak once, taking the meaning back later will be expensive.**

## TypeScript is good precisely because it is close to the host

This is not a criticism of TypeScript.

When I am writing a Web application in TypeScript, this is a feature:

```ts
const response: Response = await fetch(url)
```

The platform object is right there.

Editor tooling understands it.

The type definitions follow the Web standard.

There is very little ceremony between my code and the browser.

That closeness is one reason TypeScript is so effective for Web development.

Seseragi uses TypeScript as its first backend partly because I want to borrow that entire ecosystem.

But a source language and a host-language application have different incentives.

TypeScript wants to speak the platform's language naturally.

Seseragi needs to decide which parts of the platform become **Seseragi's own semantic contract**.

## A host `Response` object is not automatically a Seseragi `Response`

If I expose the browser `Response` object directly, I have already made several decisions without explicitly making them.

Its body model becomes my body model.

Its exception/failure conventions become part of my error semantics.

Its redirect behavior influences the public API.

Its cancellation story pushes me toward AbortController.

Its lifetime and streaming shape start defining future design constraints.

And if another backend does not naturally have exactly that object model, I either emulate the browser API forever or admit that the supposed language abstraction was actually backend-specific.

That is the part I wanted to avoid.

## The public surface should belong to Seseragi

The HTTP specification therefore defines language-facing concepts such as:

```text
Method
Status
Headers
HttpUrl
Request
Response
HttpError
```

with `Bytes` for raw bodies and typed failures in the Effect world.

Underneath that sits an HTTP capability/provider boundary:

```text
std/http
  ↓
HttpClient capability
  ↓
Provider contract
  ↓
Bun / Node / browser adapter
  ↓
host HTTP engine
```

The current work connecting the richer small-response surface is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/295

That issue is still open as of this draft.

One of its explicit rules is that host `Request`, `Response`, and `fetch` objects do not leak into the public API.

That sentence is less about abstraction aesthetics than about ownership:

**Who gets to define what HTTP means to a Seseragi program?**

I want the answer to be Seseragi, even when the actual packets are handled by `fetch`.

## Go made this boundary easier for me to appreciate

When Go code uses `net/http`, application code does not directly manipulate operating-system socket structures.

Go owns the `Request` and `Response` types exposed to its programmers, then the implementation connects them to the underlying system.

Rust libraries routinely do similar wrapping around platform-specific APIs.

That feels completely ordinary when working in those ecosystems.

My Web background had trained me to appreciate the opposite advantage: direct access to the Web platform is extremely convenient.

Building a language made me realize that the same closeness can become coupling if I am trying to preserve semantics across backends.

So I ended up making almost the reverse choice from ordinary TypeScript application code.

## Borrow the implementation, not the worldview

I do not want to build an HTTP stack.

I definitely do not want to build TLS.

I do not want to implement sockets because "language independence" sounds philosophically clean.

That would be absurd.

The host runtime already has strong I/O implementations.

Use them aggressively.

The boundary I care about is this:

```text
borrow host implementation
translate at provider boundary
keep source-language semantics stable
```

That pattern scales beyond HTTP too.

Filesystem operations, clocks, entropy, process APIs, and other external capabilities all raise the same question.

The Provider layer became useful because it gives those integrations one place to translate between Seseragi meaning and host machinery.

## If `fetch` leaks, cancellation leaks with it

Cancellation is a good example.

If the public API is basically `fetch`, explaining cancellation naturally becomes an AbortController story.

But Seseragi already has Effect cancellation semantics.

So I would rather express:

```text
Seseragi Effect is cancelled
↓
Provider receives cancellation
↓
host adapter aborts the concrete HTTP operation
```

The browser adapter may use AbortController internally.

A different backend may use something else.

The application does not need to know.

That does not hide cancellation.

It hides **the host mechanism used to implement cancellation**.

Those are different things.

## Host exceptions should cross the boundary as typed failures

The same applies to failure.

A host runtime can throw exceptions or reject Promises for reasons defined by its own API.

Seseragi's application layer wants typed failure through Effect.

So the provider boundary has another job:

```text
host failure
↓ translate
Seseragi HttpError
```

If I simply expose the host object and host exception behavior, I have skipped the point where the language gets to define its own error contract.

It is fast today.

It is harder to change tomorrow.

## Convenience helpers can leak meaning too

Host leakage is not only about object types.

It also happens when an HTTP module starts quietly absorbing neighboring semantics.

A helper called:

```text
getJson
```

already combines HTTP and JSON.

Add automatic retry, timeout, text decoding, cookies, authentication, redirects, and suddenly the HTTP core is carrying half the application's policy.

Seseragi's current split is intentionally smaller:

```text
HTTP -> HTTP semantics
Bytes -> raw body
std/text -> text decoding
std/json -> JSON
Effect/Schedule -> retry / timeout policy
```

A userland convenience library can absolutely combine those later.

The core does not need to own every convenient combination.

This is another form of semantic boundary protection.

## A backend boundary is useful precisely because the backend is powerful

There is a small apparent contradiction here.

Seseragi relies heavily on the TypeScript/JavaScript ecosystem.

And the more capable that ecosystem is, the more I want to prevent its incidental abstractions from automatically becoming Seseragi syntax and types.

At first that felt backwards.

Now it makes sense to me.

**A strong backend is easier to exploit when the source language has a clear boundary around it.**

Inside the adapter, use every host feature available.

Outside the adapter, preserve the program model the language actually wants.

## Direct `fetch` would still be the right prototype

I do not regret that the shortest prototype path is often:

```text
emit fetch
make it work
```

Early prototypes exist to discover the shape of the problem.

The mistake would be confusing the first implementation route with the final public contract.

Once HTTP became something Seseragi wanted to support across targets and Effects, the host boundary stopped being optional architecture decoration.

It became the thing that prevents today's easiest backend choice from defining tomorrow's language.

I wrote about the preceding HTTP/Effect decision here:

https://dev.to/kentaromorishita/i-dont-want-async-code-i-want-to-make-an-http-request

The principle I ended up with is simple:

**Let `fetch` do the work. Just don't let `fetch` decide what Seseragi means.**