---
title: 'Marking AI-assisted content'
description: 'A frontmatter flag that discloses when a post or deck was written with AI help'
pubDate: 2026-09-12
tags: ['meta', 'ai']
ai-assisted: true
---

# Marking AI-assisted content

Some of what gets published here is written with AI help, and some isn't. Rather than
leave that to the reader's guesswork, posts and decks now carry an explicit flag.

## How it works

Add one line to the frontmatter:

```yaml
---
title: 'Some post'
description: 'Some description'
pubDate: 2026-09-12
ai-assisted: true
---
```

That's the whole interface. The field defaults to `false`, so existing content is
unaffected and nothing is marked unless it opts in.

## What it renders

On a **blog post**, a small badge pins itself to the top-right corner and stays there
while you scroll — so the disclosure is visible from anywhere in the post, not just at
the top where it would scroll away and be forgotten. On narrow screens it drops into
the normal page flow instead of floating over the text.

On a **slide deck**, it renders as a footer in the bottom-right corner of every slide.
That placement is deliberate: Marp already puts its own `footer` element bottom-left
and the page number bottom-right but inset, so the disclosure sits in the one corner
that was free. It carries through to the downloadable PDF too, because the same
renderer produces both.

## Why a flag rather than a tag

Tags describe what a post is *about*. This describes how it was *made*. Mixing the two
would mean an "ai" tag that sometimes means "this post discusses AI" and sometimes
means "AI helped write this post" — and those are different claims. A separate boolean
keeps them separate.

This post, for the record, has the flag set.
