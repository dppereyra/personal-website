---
marp: true
theme: wave
paginate: true
title: 'Marking AI-assisted content'
description: 'Disclosing AI help on posts and decks with a single frontmatter flag'
pubDate: 2026-09-12
tags: ['meta', 'ai']
ai-assisted: true
---

# Marking AI-assisted content

Disclosing AI help with one frontmatter flag.

---

## The interface

```yaml
ai-assisted: true
```

- Defaults to `false`
- Same field for posts and decks
- Nothing is marked unless it opts in

---

## What it renders

- **Posts** — a badge fixed to the top-right corner, staying put as you scroll
- **Decks** — a footer in the bottom-right of every slide
- **PDFs** — carried through automatically, same renderer

---

## Why not just a tag?

Tags say what something is *about*.

This says how it was *made*.

An `ai` tag would blur those two claims together — a boolean keeps them apart.

---

## This deck

The flag is set on this deck.

Look at the bottom-right corner.
