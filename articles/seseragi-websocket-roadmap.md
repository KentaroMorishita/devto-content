---
title: "Somehow WebSocket Ended Up on My Programming Language Roadmap"
published: false
tags: programming, webdev, websocket, seseragi
description: "The weird part isn't that I want WebSocket. It's that I don't want it to introduce a fourth I/O model when Effect, Stream, and resource semantics already exist."
series:
main_image:
canonical_url:
---

I started by building a programming language.

Then Web UI worked.

HTTP client work appeared.

HTTP server work appeared.

Database work appeared.

And eventually I looked at the roadmap and found **WebSocket** sitting there too.

Who asked for this?

Me, apparently.

The interesting part is not that a Web language eventually wants WebSocket.

It is what I do **not** want WebSocket to add to the language.

## The fastest implementation would expose the host model

In browser TypeScript, this is wonderfully direct:

```ts
const socket = new WebSocket(url)

socket.onmessage = event => {
  console.log(event.data)
}

socket.send("hello")
```

Open, message, error, close.

The platform already decided the object model and event lifecycle.

For an application language running on the Web, wrapping that API would be an extremely fast path to a demo.

But Seseragi already has concepts for different shapes of I/O:

```text
one external operation
  -> Effect

multiple values over time
  -> Stream

lifetime / cleanup
  -> resource scope
```

If WebSocket arrives as:

```text
onMessage(callback)
onClose(callback)
```

I have created another I/O mini-language instead of reusing the one I already spent time designing.

## Receive looks like Stream. Send looks like Effect.

A WebSocket connection is surprisingly easy to describe using existing categories.

Incoming messages arrive over time:

```text
receive
  -> Stream<..., Message>
```

Sending one message is an I/O operation:

```text
send
  -> Effect<..., ..., Unit>
```

The connection itself owns a lifetime.

Close and cancellation matter.

Resources need cleanup.

So instead of asking:

> What special programming model should WebSocket have?

I can ask:

> How should WebSocket protocol semantics sit on top of Effect, Stream, resource, and Provider?

That is a much smaller design problem.

## This is why Stream has to exist first

The WebSocket application-surface work is tracked here:

https://github.com/KentaroMorishita/seseragi/issues/327

As of this draft, #327 is still open.

It depends on the generic Stream core, which is also still being wired into normal source code.

I wrote about that dependency from the HTTP streaming side here:

https://dev.to/kentaromorishita/i-have-an-http-streaming-issue-i-dont-have-stream-yet

I could bypass that work and create a temporary callback API for WebSocket today.

Then later I would either maintain two models or migrate the public API.

Public surfaces are much harder to remove than private prototypes.

So the roadmap is slower on purpose.

**I would rather delay the feature than create a second meaning for values-over-time.**

## Go and Rust show other ways to reuse the language's existing concurrency model

In Go, it is natural to run a receive loop and feed messages into channels or coordinate them with goroutines and context.

In Rust's async ecosystem, libraries may expose Stream/Sink-like abstractions around WebSocket halves.

Those ecosystems do not need WebSocket to invent an entirely separate execution universe.

Seseragi is aiming for the same broad property with different primitives.

It has typed Effect failures and requirements, a planned cold Stream with backpressure, and Provider/resource boundaries.

The point is not to copy Rust Stream or Go channel.

The point is to **reuse the language's own existing answers** when a new protocol arrives.

## Backpressure is where callback-only design stops being cute

Suppose messages arrive faster than application code can process them.

A naive implementation can just keep adding them to a queue:

```text
network
↓↓↓↓↓↓↓↓↓↓
unbounded queue
↓
slow consumer
```

It works until memory becomes the backpressure strategy.

That is not a strategy I want to accidentally standardize.

#327 therefore treats send/receive flow control as a real design concern and explicitly avoids creating an unbounded message queue behind the user's back.

This is another reason to wait for the generic Stream contract.

HTTP bodies, WebSocket messages, DB cursors, and filesystem streams all eventually run into producer/consumer speed differences.

I want one backpressure story underneath them rather than four protocol-specific accidents.

## Close is not automatically failure

Once WebSocket becomes a typed application API, even ordinary lifecycle events become design questions.

A remote peer closes normally.

The network breaks.

A protocol violation occurs.

The application cancels the connection.

Those are not necessarily the same thing.

Especially this:

```text
remote close
```

should not automatically become:

```text
typed application failure
```

just because the host API reports it through an event object.

#327 explicitly keeps failure, remote close, and cancellation distinct.

That is exactly the sort of decision I would avoid making if I simply exposed the browser WebSocket object and called it done.

## Reconnect is useful and deliberately not part of the core

Another obvious feature is automatic reconnect.

Connection drops.

Wait with exponential backoff.

Reconnect.

Maybe restore session state.

Many applications want this.

I still do not want the core WebSocket semantics to do it invisibly.

Reconnect is application policy.

It can be composed with Effect scheduling/retry behavior later.

The transport surface should tell the application what happened rather than silently deciding how to recover.

This is the same design instinct that keeps automatic retry out of the HTTP core.

Convenience is useful.

Invisible policy is expensive.

## Bun-specific power should not define the portable API

Bun already has strong server-side WebSocket functionality, including upgrade support.

Seseragi can absolutely use it in the Bun provider/target extension.

But this is the same host-boundary problem again:

```text
Bun can do X
```

does not automatically imply:

```text
portable std WebSocket guarantees X everywhere
```

#327 explicitly separates Bun's target-specific extension from the portable application surface.

Browser clients, Node/Bun servers, and future runtimes need a common semantic core that each supported target can honestly implement.

Host capability and language guarantee are not the same list.

## WebSocket Stream is not HTTP body Stream either

Both involve Bytes over time.

That does not make their protocols identical.

WebSocket has message boundaries, text/binary distinction, close frames, subprotocols, upgrade semantics, and other protocol-level concepts.

HTTP body streaming has its own request/response framing and trailer semantics.

I want them to share lower-level Stream behavior such as demand, cancellation, and resource cleanup.

I do **not** want the shared abstraction to erase protocol meaning.

That is another recurring rule in Seseragi:

**Share the lower-level semantics. Keep the domain-specific meaning above them.**

## Right now this is still roadmap architecture, not a chat-app demo

There is no finished portable Seseragi WebSocket application API today.

#327 is open.

Generic Stream is still being connected too.

So this article is not a "look what you can build in the Playground" article.

It is a record of the slightly absurd moment where I realized my self-made language now has to answer questions such as:

```text
What is a WebSocket message type?
Is remote close failure?
How does receive backpressure work?
What owns the connection lifetime?
Which upgrade features are portable?
```

That is a long way from getting the first compiler expression to evaluate.

Somehow WebSocket got onto the roadmap.

The only thing stopping that from feeling completely out of control is that I do not need a new programming model for it.

The existing ones are finally starting to pay rent.