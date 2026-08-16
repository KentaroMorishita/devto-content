---
title: "I'm Building a Programming Language by Arguing With ChatGPT"
published: false
zenn_published_at: "2026-08-14T18:35:00+09:00"
tags: ai, chatgpt, programming, seseragi
description: "A surprising amount of Seseragi's design comes from arguing with ChatGPT until I can explain exactly why an idea feels wrong."
series:
main_image:
canonical_url:
---

A surprisingly large part of Seseragi's design has come from talking things through with ChatGPT.

If I write "AI helps me design the language," that sounds impressively modern.

The reality is less elegant.

We argue a lot.

"That's not what I mean."

"Why did you do that?"

"Don't suddenly introduce a different worldview."

"That's just Elm."

"Ugly."

"Gross."

And occasionally the feedback degenerates all the way to:

"anus"

I don't recommend this communication style with human coworkers.

## I don't begin with the answer

Saying "I'm building a programming language" can make it sound as if a complete specification already exists in my head and the only remaining work is translating it into a compiler.

That is absolutely not how this project works.

A lot of features begin around the level of:

"Wouldn't this feel nicer?"

For Web UI, for example, the starting discomfort was:

**I don't like that UI suddenly seems to require a completely different programming model.**

From there, I end up having long conversations with ChatGPT:

- Could Html just be a value?
- Could a component just be a normal function?
- Could changing state be represented as Signal, still connected to ordinary values?
- Could events be ordinary ADT values called Action?

ChatGPT proposes something plausible.

I say it feels wrong.

It proposes another version.

I say that feels wrong too.

Once in a while it produces something genuinely good.

Then I immediately switch sides and praise it.

From the AI's point of view, I am probably an exhausting user.

## The useful work is explaining what is wrong

The biggest value in these conversations isn't that AI gives me the correct design.

It's that **I keep getting forced to explain what I dislike**.

"This feels gross" is not a design principle.

But if I keep asking why, eventually something more concrete appears:

- responsibilities are mixed together
- backend implementation details leaked into the public surface
- two things with the same meaning require unrelated syntax
- a special concept was invented where an ordinary function would work
- something the type system could express was pushed into a runtime convention

At that point, "gross" becomes an actual design decision.

I think that describes my process better than pretending I begin with formal theory.

I notice discomfort first and excavate the reason afterward.

## ChatGPT is wrong all the time

Obviously, ChatGPT makes mistakes.

It pulls Seseragi toward patterns from more familiar languages.

It invents syntax that does not exist.

It mixes old versions of the language with the current one.

Ask it for UI and sometimes all the spacing disappears and the result looks like a website from decades ago.

I get annoyed.

But even those failures can be useful.

The moment I think "that is not Seseragi," I learn something about what *is* Seseragi.

A lot of the language's design principles did not emerge only from accumulating good ideas.

They also emerged from **seeing a large number of plausible-but-wrong ideas and repeatedly rejecting them**.

## Codex writes implementation; I keep arguing about meaning

The current Seseragi compiler is implemented in Rust.

I do not personally follow every implementation detail line by line.

Codex writes a large portion of the code.

That has shifted where I spend my attention.

I become extremely picky about questions like:

- what does this mean in Seseragi?
- what should the language guarantee?
- where does a backend concern begin?
- what belongs on the public surface?
- does this syntax actually feel good to write?

Instead of spending all my time typing the implementation, I spend more time deciding **what I should ask to be implemented, and whether the result is really the thing I wanted**.

The ChatGPT arguments are part of that process.

## This is not insult-driven development

After everything above, it may sound like Seseragi is built with Insult-Driven Development.

Probably not.

I think the actual loop is closer to:

```text
discomfort
↓
put it into words
↓
propose a design
↓
implement it
↓
use it
↓
notice the next discomfort
```

The real conversation logs do contain a suspicious number of variations of "why would you do that?" though.

## The Playground is the final judge

A design can sound excellent in conversation and immediately feel wrong once I type it into the Playground.

The reverse happens too.

Something can look questionable in theory, then feel strangely natural the moment I actually write code with it.

In the end, I usually decide by using it.

https://seseragi.vercel.app/

https://seseragi.vercel.app/tour/

https://github.com/KentaroMorishita/seseragi

So maybe the strongest review tool in the Seseragi project isn't the compiler, the test suite, or ChatGPT.

Maybe it's the author's immediate reaction of:

**"Doesn't this feel kind of gross?"**

If I call that a "high-dimensional heuristic," it sounds much more sophisticated.

In practice it's usually just me staring at the code and saying, "This looks wrong."

I have, incidentally, conducted prior research into this heuristic.

https://qiita.com/KentaroMorishita/items/9f795996328438f1cec3