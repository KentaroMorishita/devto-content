---
title: "Then I Realized an HTTP Handler Can't Stay Pure"
published: false
tags: programming, webdev, effects, seseragi
description: "Request -> Response looks clean until the handler needs a database, another HTTP service, or a clock. Then the real question becomes handler lifetime and Effect boundaries."
series:
main_image:
canonical_url:
---

Seseragi got Web UI running in the browser.

Then HTTP client work appeared.

Then I looked further down the roadmap and found an HTTP server.

At this point I occasionally wonder how far this language intends to go.

The first design problem was immediate.

A neat server handler type would be:

```text
Request -> Response
```

Very pure.

Very elegant.

Also not enough for most Web applications.

## Real handlers call things

Imagine:

```text
POST /users
```

The handler may:

1. read request bytes
2. decode JSON
3. insert into PostgreSQL
4. call another service
5. read the clock
6. construct a response

That is ordinary server application code.

So the more honest handler shape is closer to:

```text
Request -> Effect<R, E, Response>
```

The request is an ordinary input value.

The handler returns the Effect that performs the request's application work.

This fit the rest of Seseragi surprisingly well.

## TypeScript and Rust naturally say `async handler`

In TypeScript:

```ts
const handler = async (request: Request): Promise<Response> => {
  // DB / HTTP / etc.
  return new Response("ok")
}
```

Rust Web frameworks often put `async fn` at the same boundary.

That is a very natural representation when Future/Promise is the language/ecosystem's normal asynchronous computation type.

Seseragi already had another abstraction at the application level:

```text
Effect<R, E, A>
```

And I wanted the handler signature to preserve information that "async" alone does not say:

```text
What capabilities does the handler require?
What typed failure may it produce?
What result does it return?
```

So I did not want HTTP server code to escape into a separate Promise-shaped programming model merely because the TypeScript runtime underneath is asynchronous.

## Go puts the boundary somewhere else again

Go handlers can simply perform I/O inside ordinary function bodies:

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // DB / HTTP / etc.
}
```

Concurrency and cancellation exist, but the type of the handler does not advertise an Effect/Future value.

That is extremely straightforward.

Seseragi deliberately makes a different tradeoff: external capability and typed failure should remain visible in the computation type.

Same HTTP server problem.

Different answer about what the type system should expose.

## The moment the handler returns Effect, lifetime becomes the real problem

Changing the function type is easy.

Then you ask how it executes.

Each incoming request should start a fresh handler Effect.

Multiple requests run concurrently.

Those executions share a server lifetime but have independent request scopes.

If the server closes, what happens to in-flight handlers?

What if a handler completes after its response is no longer writable?

What if cancellation arrives while a DB transaction is active?

The HTTP handler problem suddenly turns into a structured-lifetime problem.

The contract work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/296

As of this draft, #296 is still open.

## One request should own one Effect execution

This rule sounds obvious and matters a lot.

A handler Effect should not accidentally become one global computation reused across requests.

Each request needs its own:

- environment projection
- typed failure path
- cancellation scope
- resource lifetime
- execution state

At the same time, the server itself owns a longer-lived resource scope.

So the relationship is roughly:

```text
server resource scope
├─ request handler scope A
├─ request handler scope B
└─ request handler scope C
```

Closing/cancelling the server has to supervise the children without pretending all request failures are server failures.

This is where the Effect/resource design stops feeling theoretical.

## Failure has several meanings here

A server can fail to bind a port.

A request boundary can be malformed.

Application code can return a typed domain failure.

Writing the response can fail.

The root can be cancelled.

A defect can occur.

Putting all of those into one exception channel would be easy at the host level and fairly opaque at the source level.

#296 explicitly aims to separate:

```text
provider/listen failure
request boundary failure
application typed failure
response write failure
cancellation
defect
```

The application `E` should not automatically become the same thing as the HTTP provider breaking.

Again, Effect becomes useful because it gives the language somewhere to keep distinctions that a host runtime might otherwise collapse into rejected Promises or thrown exceptions.

## The actual server surface is another Issue

Once the handler contract is fixed, the next implementation slice is:

https://github.com/KentaroMorishita/seseragi/issues/297

#297 is also still open.

It connects application code to:

- request method
- URL/path/query
- headers
- Bytes body
- explicit response status/headers/body
- text/JSON helpers where meaning is unambiguous
- Effectful handler execution
- cancellation and cleanup

The intended end-to-end fixture is pleasantly ordinary:

```text
POST /users
-> request Bytes
-> UTF-8 decode
-> JSON decode
-> Effectful DB/application work
-> User
-> JSON encode
-> HTTP response
```

If that runs as ordinary Seseragi code, several parts of the language/toolchain finally meet in one realistic application path.

## JSON is still not secretly part of the HTTP server

Even though the end-to-end example uses JSON, the server core should not automatically decode every request as JSON.

The body is Bytes.

If it is text, decode it explicitly.

If it is JSON, pass it to `std/json` explicitly.

That keeps the protocol layers separate:

```text
HTTP framing
↓
Bytes
↓ optional
text decoding
↓ optional
JSON
```

A router/framework can provide convenience later.

The standard server surface does not need to decide every application's wire format.

## Router DSL can wait

The moment you say "HTTP server," it is very easy to start inventing:

- route syntax
- middleware
- authentication
- sessions
- validation framework
- dependency injection

That is exactly how a language project quietly becomes a Web framework project.

So both #296 and #297 keep those things out of scope.

First make this vertical slice honest:

```text
Request
-> Effect
-> Response
```

with correct lifetime and failure semantics.

A thin core gives future libraries room to experiment without the language standardizing an application architecture too early.

## The host Promise can stay underneath

The TypeScript runtime/provider may ultimately implement handlers using Promise/async functions.

That is fine.

The source-level contract does not need to say:

```text
Request -> Promise<Response>
```

for exactly the same reason the HTTP client should not expose Promise as its meaning.

Promise is one backend mechanism.

Effect is the language's application-level computation contract.

The provider translates between them.

## I only wanted to call the database from a handler

That is the funny development sequence.

The original requirement was basically:

> A pure handler cannot do enough. I need I/O.

Then the questions became:

```text
What is the handler Effect type?
How does R merge with server requirements?
What happens to E?
How long does each handler live?
How does root cancellation supervise requests?
What is a late completion?
Which failures belong to the provider?
```

I asked for a database call and ended up thinking about structured concurrency.

This is becoming a reliable pattern in Seseragi.

A simple application requirement finds a deeper language/runtime boundary that was waiting underneath it.

The server surface is not finished yet, so this is not a Playground-ready feature article.

But the design direction feels clear:

**An HTTP handler is not "async because networking is async." It is an Effectful application computation because real request handling touches the outside world.**