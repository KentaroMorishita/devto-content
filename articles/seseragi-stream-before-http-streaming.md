---
title: "I Have an HTTP Streaming Issue. I Don't Have Stream Yet."
published: false
tags: programming, streams, webdev, seseragi
description: "It looks backwards until you notice the architecture: I don't want HTTP to invent one streaming model before the language has a reusable Stream contract."
series:
main_image:
canonical_url:
---

There is already an Issue for HTTP streaming in Seseragi.

Streaming request bodies.

Streaming response chunks.

Backpressure.

Cancellation.

Resource ownership.

It sounds fairly advanced.

There is one small problem:

**`std/stream` itself is not wired into normal Seseragi source yet.**

That sounds like I wrote the roadmap backwards.

The more I looked at it, the more I thought the ordering was actually the interesting part.

## The fastest HTTP solution would be an HTTP-only stream API

If I only cared about getting response chunks to a callback, I could invent something like:

```text
onChunk
onEnd
onError
```

inside the HTTP module.

That would be completely workable.

The Web platform already has `ReadableStream`.

Node has its own long-standing stream APIs.

Reactive libraries have Observables.

I could wrap whichever host API is closest and ship something quickly.

The problem appears later when filesystem streaming, WebSocket messages, database cursors, or other long-lived producers show up.

Then the language accumulates several things that all mean roughly:

```text
multiple values arrive over time
```

but each one has a different callback vocabulary and lifecycle model.

```text
HTTP chunk callback
WebSocket message callback
DB cursor callback
filesystem read callback
```

That is exactly what I do not want.

## I want the reusable concept before the HTTP specialization

The Seseragi specification already describes a cold:

```text
Stream<R, E, A>
```

The intent is not merely "an array whose values are late."

The contract includes things such as:

- cold execution
- demand
- bounded buffering/backpressure
- cancellation
- resource lifetime
- transformations
- terminal operations

That core implementation is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/313

Issue #313 is still open as of this draft.

So the desired order is:

```text
define/implement Stream semantics
↓
connect host/provider streaming to that contract
↓
put HTTP streaming on top
```

HTTP is a consumer of Stream semantics, not the place where Stream semantics are invented accidentally.

## TypeScript taught me how many "stream" worlds can coexist

In Web development, `stream` is already overloaded.

The browser has Web Streams.

Node has Node streams.

RxJS has Observable.

They all involve values over time, but their contracts differ.

Backpressure differs.

Cancellation differs.

Hot/cold behavior differs.

Resource lifetimes differ.

Interoperability is possible, but they are not one semantic object merely because the word "stream" appears in the docs.

That is exactly why I do not want Seseragi's first implementation to simply declare one host API to be the language definition.

The source-language question comes first:

**What does a Seseragi Stream promise?**

Then browser/Bun/Node adapters can translate their host models into that promise.

## Go channels are nearby but not the abstraction I am trying to recreate

A Go channel gives a very clean producer/consumer shape:

```go
for value := range ch {
    // ...
}
```

There is a lot I like about how explicit that concurrency model is.

But Seseragi Stream is intended to be centered on a cold composable computation with collection-like transformations and terminal execution, not on exposing a general channel primitive as the main abstraction.

The desired questions are more like:

```text
When does this producer start?
What resources does each run own?
How much demand has the consumer signaled?
Can map/filter preserve streaming?
What happens on early termination?
```

There is overlap with channels.

There is overlap with Observable.

There is overlap with streaming libraries in Haskell.

None of those identities alone is what I want to import wholesale.

## "A sequence of values" is nowhere near enough for I/O streaming

This became obvious as soon as I wrote down the runtime contract.

Suppose the producer is faster than the consumer.

What happens?

Unbounded buffering?

Drop values?

Block/pause producer work?

How large is the buffer?

What happens if the consumer stops after three values?

Who closes the file/socket/database cursor?

What happens to the producer on Effect cancellation?

These are not optimization details.

For an I/O Stream, they are semantic behavior.

That is why #313 spends so much space on demand, bounded buffers, cancellation, and resource lifetimes instead of merely defining `map` and `filter`.

## Haskell streaming libraries make more sense to me now

Haskell has lazy lists, but real I/O streaming did not collapse into "just use lazy List for everything."

Libraries such as Pipes and Conduit exist because effects, resource safety, incremental consumption, and composition create a richer problem.

I am not trying to clone those libraries.

The useful lesson is the same one I discovered the painful way:

```text
multiple values
```

is not a sufficient streaming contract.

Once external resources enter the picture, lifetime and demand become first-class concerns.

## Then HTTP can add HTTP-specific meaning on top

The HTTP streaming work is tracked separately:

https://github.com/KentaroMorishita/seseragi/issues/319

That issue is also still open.

It depends on Stream core and adds things specific to HTTP:

```text
request body producer
response started
response body chunks
trailers
connection ownership
HTTP cancellation
```

The intended layering is:

```text
Stream demand/backpressure/resource semantics
              ↓
        HTTP exchange
```

Not:

```text
invent something stream-ish inside HTTP
then later pretend it is generic Stream
```

That order looks slower today and much safer tomorrow.

## `http.exchange` should not be a one-shot request wearing a Stream costume

This requirement is explicit in #319.

Seseragi already has a one-shot provider HTTP send path.

It would be easy to implement `exchange` by fully buffering request/response bodies and then emitting the finished result as if it had streamed.

That would satisfy the type name and violate the reason the API exists.

The real streaming contract has to preserve:

- cold execution
- demand-driven body production
- chunk delivery
- early stop
- cancellation
- connection/resource cleanup

**Calling something Stream does not make full buffering streaming.**

This sounds obvious, but product APIs accumulate this kind of semantic lie easily when implementation pressure is high.

## Small-response HTTP is intentionally a separate milestone

There is another open issue, #295, for ordinary small-response HTTP.

That path can return a response body as `Bytes` without waiting for Stream core.

So the roadmap is deliberately split:

```text
small-response HTTP
  -> #295

Stream core
  -> #313

full HTTP streaming
  -> #319
```

That keeps a useful everyday HTTP client from being blocked on the hardest streaming semantics.

At the same time, it keeps the eventual streaming API from being rushed into an HTTP-specific design just to make one feature complete.

The product surface may eventually make both feel close together.

The implementation contracts do not have to be developed as one giant Issue.

## Backpressure is exactly the kind of thing that becomes expensive to retrofit

A naive streaming API can start as:

```text
producer pushes values whenever it wants
consumer callback receives them
```

Then the real world arrives.

A socket produces faster than processing can keep up.

A DB cursor prefetches too aggressively.

A WebSocket floods messages.

An HTTP response fills memory.

Now you need buffering and flow control after applications have already grown around the push-only semantics.

That is why I want the core Stream contract to establish demand/backpressure before HTTP depends on it.

It is much easier to provide a higher-level convenience operation later than to remove an accidental unbounded-buffer guarantee from production code.

## Bytes stay Bytes here too

The HTTP exchange design emits body chunks as `Bytes`.

It does not automatically decode Content-Encoding, UTF-8, or JSON.

Those are separate operations:

```text
Stream<Bytes>
↓ optional decoding
Stream<String>
↓ optional JSON processing
...
```

Again, convenience helpers can exist later.

The Stream and HTTP cores should not silently acquire application semantics merely because one common use case needs them.

That separation is one of the most repeated design instincts in Seseragi at this point.

## An Issue can be useful before its implementation exists

Normally an open Issue is just evidence that something is unfinished.

Here it also records the reasoning order:

```text
I want HTTP streaming
↓
HTTP-specific callbacks would be easy
↓
that would create a second streaming language
↓
make generic Stream semantics real first
↓
put HTTP exchange on top
```

That is valuable even before a line of the final public API runs.

Right now both #313 and #319 are open, so these are not Playground-ready features.

And that is fine.

The interesting story is not "look, streaming works."

It is:

**HTTP streaming is already on the roadmap, and the reason I am not implementing it first is that I do not want HTTP to accidentally define what Stream means for the entire language.**