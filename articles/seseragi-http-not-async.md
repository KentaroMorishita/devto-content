---
title: "I Don't Want Async Code. I Want to Make an HTTP Request."
published: false
tags: programming, webdev, effects, seseragi
description: "The TypeScript backend may use Promise and fetch underneath. That does not mean Promise should become Seseragi's public model for HTTP."
series:
main_image:
canonical_url:
---

I want Seseragi to be useful for Web development.

So eventually it needs an HTTP client.

The moment you say that in a JavaScript-shaped world, a whole package of concepts appears automatically:

```text
fetch
Promise
async / await
AbortController
```

I have used those concepts for years.

Then, while designing the Seseragi surface, I realized something embarrassingly simple:

**I don't actually want to do "async programming." I want to make an HTTP request.**

That changed where I wanted the runtime machinery to live.

## Application code wants request and response semantics

From the application's point of view, an HTTP operation is roughly:

```text
method
URL
headers
body
  ↓
request
  ↓
response
```

The operation can fail.

It takes time.

Cancellation matters.

But those are properties of the operation.

They do not automatically imply that the source-language user should manipulate the host's asynchronous representation directly.

Seseragi already has:

```text
Effect<R, E, A>
```

So an HTTP request can appear as an Effect with an HTTP capability requirement, typed failure, and response value.

That is the semantic surface I care about.

## TypeScript naturally puts Promise in front of you

A familiar TypeScript example is:

```ts
const response = await fetch(url)
const body = await response.text()
```

This is an excellent fit for JavaScript's execution model.

But the code is simultaneously talking about two things:

```text
HTTP
```

and:

```text
waiting for Promise results
```

Because I have written Web code for so long, I usually do not notice the distinction.

Building a language forced me to ask whether Seseragi should expose both concepts at the same layer.

I decided it should not have to.

## Go proves that slow I/O does not force Future-shaped source syntax

Go HTTP code can look like:

```go
resp, err := http.Get(url)
if err != nil {
    return err
}
```

There is no Promise value in the source-level API.

Concurrency and cancellation have their own tools, including goroutines and `context`.

Rust makes another perfectly valid choice by exposing `Future` and using `async`/`await` extensively.

The point is not that one style is better.

The point is that:

```text
this I/O takes time
```

does not uniquely determine:

```text
the language must expose Promise/Future as the application abstraction
```

That is a language/runtime design choice.

## TypeScript can be the backend without Promise becoming Seseragi semantics

Seseragi's first formal backend is TypeScript.

So yes, generated runtime code will often use Promise.

The browser provider can use `fetch`.

Bun or Node can use appropriate host HTTP facilities.

Cancellation may become an AbortController or another host primitive.

I want to borrow all of that infrastructure.

What I do not want is for the source API to become:

```text
Promise
Request
Response
DOMException
AbortController
```

merely because those objects happen to be convenient in the first backend.

The boundary I want is:

```text
Seseragi source
↓
std/http
↓
HttpClient capability
↓
Provider boundary
↓
host HTTP engine
```

**Use the host implementation. Do not confuse the host implementation with the language contract.**

## This is one of the jobs Effect turned out to be good at

I did not add Effect because my goal was to make side effects disappear.

I wanted external operations to remain visible and typed.

I wrote that broader story here:

https://dev.to/kentaromorishita/i-dont-want-to-eliminate-side-effects-i-want-to-see-them-2hol

For HTTP, that gives me a useful place to represent:

```text
required capability/environment
failure type
response type
cancellation/execution boundary
```

The backend can then map those semantics to whatever host mechanism actually performs the work.

That feels much more stable than making the JavaScript Promise model part of Seseragi's source-language identity.

## The provider is allowed to be messy

This is an important freedom.

Inside the provider layer:

- browser `fetch` can run
- Bun/Node HTTP engines can run
- host exceptions can be caught and translated
- cancellation can connect to host abort mechanisms

I do not need to reimplement the networking stack just to keep the source model pure.

The host is good at I/O.

Use it.

The architectural rule is only that host-specific objects and failure conventions should be translated at the provider boundary before becoming ordinary Seseragi application values.

That is a much more practical form of abstraction than pretending the runtime underneath does not exist.

## The HTTP public surface is still intentionally unfinished

As of this draft, Seseragi already has a minimal `std/http` surface and an existing provider execution path.

But the fuller small-response API is still being wired into normal source code.

That work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/295

Issue #295 is still open.

The current minimal module has things such as `get`, `status`, `bodyText`, and `errorMessage`.

The specification goes farther and defines public identities and operations around:

- Method
- Status
- Headers
- HttpUrl
- Request
- Response
- Bytes body
- typed build/network failures
- explicit send operations

The provider engine already exists, so the task is not "invent HTTP from scratch."

It is:

**Decide what the Seseragi application should see, then connect the existing engine to that contract.**

## Request is meant to be a Seseragi value, not a host Request object

One of the explicit #295 rules is that provider host objects such as JavaScript `Request`, `Response`, and `fetch` objects must not leak into the public API.

The public Request is an immutable Seseragi value.

That gives the language ownership over its contract.

A future backend does not have to fake the exact object model of browser fetch merely because that happened to be the first implementation.

This is the same TypeScript-backend lesson showing up in a library surface:

```text
backend implementation can change
source semantics should remain stable
```

## HTTP should not secretly become JSON, retry, timeout, and authentication too

A convenient HTTP library can accumulate a lot of automatic behavior.

Automatic JSON decoding.

Automatic retry.

Automatic redirects.

Automatic timeout.

Authentication and cookies.

Content decoding.

Some libraries make excellent use of those conveniences.

For Seseragi's small core HTTP surface, I want the opposite starting point.

The open issue explicitly says:

- do not automatically follow redirects
- do not hide retry/timeout inside HTTP core
- do not automatically decode JSON
- do not silently add cookie/authentication frameworks

Those are separate meanings.

If retry is needed, compose HTTP with scheduling/retry behavior.

If JSON is needed, decode the Bytes through JSON functionality.

If timeout is needed, make timeout visible in the effect composition.

The core operation should not accumulate unrelated policy just because all of it often appears near HTTP.

## This is where Go's thin `net/http` instinct is attractive to me

Go's standard HTTP surface gives you fairly direct primitives and lets surrounding code decide many higher-level policies.

Seseragi is not copying Go's API.

Its typed Effect/capability model is very different.

But I sympathize with the idea that the HTTP layer should remain recognizably about HTTP.

The language can provide strong composition tools without making the networking API itself omniscient.

## `async/await` would solve a different problem

While building a language, it is tempting to reconstruct the checklist of familiar language syntax:

```text
Do I need async?
Do I need await?
Do I need Future?
```

Maybe Seseragi will eventually gain additional asynchronous/concurrency surfaces where they make sense.

But HTTP did not need to wait for that decision.

The important application requirement was already expressible:

```text
perform an external operation
require an HTTP capability
fail in a typed way
produce a response
compose with other Effects
```

That is enough to design HTTP semantics.

The runtime can use Promise underneath without asking the source programmer to care.

## The slogan sounds obvious only after the boundary is chosen

When I started thinking about HTTP, JavaScript concepts arrived first because that is the host ecosystem I know best.

After separating the layers, the design became much simpler to state:

**The user wants HTTP. The runtime can worry about asynchronous machinery.**

That does not eliminate asynchronous execution.

It puts it where it belongs.

Issue #295 is still in progress, so the full small-response examples are not something I want to present as finished Playground code yet.

But the architectural direction is already clear:

```text
application meaning on top
host mechanism underneath
Effect at the boundary
```

The TypeScript backend can use every Web primitive it needs.

Seseragi source should only inherit the ones that actually belong to Seseragi's programming model.