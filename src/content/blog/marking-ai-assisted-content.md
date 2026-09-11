---
title: 'Marking AI-assisted content'
description: 'Why this site discloses AI help, and how one frontmatter flag reaches both a blog badge and a slide footer'
pubDate: 2026-09-12
tags: ['meta', 'ai', 'astro', 'marp', 'css', 'testing']
ai-assisted: true
---

# Marking AI-assisted content

Some of what gets published here is written with AI help, and some isn't. Rather than
leave that to the reader's guesswork, posts and decks carry an explicit flag.

This post covers why it works the way it does, and what the integration actually looks
like — both halves of it, since blog posts and slide decks render through completely
different pipelines.

## Why disclose at all

Three reasons, in the order they mattered:

1. **The reader can't tell, and shouldn't have to guess.** A well-edited AI-assisted
   post and a hand-written one look identical. Leaving that ambiguous quietly asks the
   reader to discount everything.
2. **Silence generalises.** Without a marker, a reader who suspects one post was
   AI-assisted has no reason to believe any other wasn't.
3. **It has to be per-item, not site-wide.** A banner saying "some content here is
   AI-assisted" is technically true and practically useless.

## Why a flag and not a tag

The obvious shortcut is an `ai` tag. It's wrong, and the reason is worth stating:

> Tags describe what a post is *about*. This describes how it was *made*. An `ai` tag
> would mean "this post discusses AI" on one post and "AI helped write this post" on
> the next — two different claims sharing one label.

A boolean keeps them separate. This post happens to be both, which is exactly the
collision that would make a shared tag ambiguous.

## The interface

One field, on the schema both collections already share:

```yaml
---
title: 'Some post'
description: 'Some description'
pubDate: 2026-09-12
ai-assisted: true
---
```

In `src/content.config.ts`:

```ts
const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  // Opt-in disclosure. Blog posts render a floating corner badge; slide decks
  // render a footer in the Marp theme (see src/utils/marp.ts).
  'ai-assisted': z.boolean().default(false),
});
```

It defaults to `false`, so every existing post and deck was unaffected and nothing is
marked unless it opts in.

## Blog posts: a badge that doesn't scroll away

The post template checks the flag and renders an `aside`:

```astro
{post.data['ai-assisted'] && (
  <aside class="ai-assisted-badge" aria-label="Disclosure">
    This post is AI-assisted
  </aside>
)}
```

The interesting part is the CSS, because the placement is the whole point. A
disclosure sitting in the header scrolls away after the first screen and is forgotten
for the rest of a long article:

```css
.ai-assisted-badge {
  position: fixed;
  top: 5.5rem;       /* clears the sticky navbar at top: 0.75rem */
  right: 1.5rem;
  z-index: 30;       /* below the navbar's 40, so it never covers the nav */
  /* ...appearance... */
  pointer-events: none;
}

/* On narrow screens the fixed badge would sit on top of the article text, so
   it drops to the flow of the page instead of floating over it. */
@media (max-width: 640px) {
  .ai-assisted-badge {
    position: static;
    margin-bottom: 1rem;
  }
}
```

Three decisions are encoded there: `fixed` so it survives scrolling, a `z-index` below
the navbar so the two never fight, and a breakpoint where floating stops being helpful
and starts being in the way.

## Slide decks: translating a field into a directive

Decks are the harder half. `ai-assisted` is a content-collection field, and Marp has
never heard of it — it parses the same frontmatter looking for *its* directives and
ignores everything else.

So `renderSlides` translates. It reads the flag and emits Marp's own `class` global
directive, which tags every `<section>`:

```ts
function withAiAssistedClass(rawMarkdown: string): string {
  const frontMatter = rawMarkdown.match(FRONT_MATTER_RE);
  if (!frontMatter) return rawMarkdown;

  const [matched, open, body, close] = frontMatter;
  if (!AI_ASSISTED_RE.test(body)) return rawMarkdown;

  const existingClass = body.match(CLASS_LINE_RE);
  let nextBody: string;

  if (existingClass) {
    const classes = existingClass[1].trim().replace(/^['"]|['"]$/g, '')
      .split(/\s+/).filter(Boolean);
    if (classes.includes(AI_ASSISTED_CLASS)) return rawMarkdown;
    classes.push(AI_ASSISTED_CLASS);          // append, never replace
    nextBody = body.replace(CLASS_LINE_RE, `class: ${classes.join(' ')}`);
  } else {
    nextBody = `${body}\nclass: ${AI_ASSISTED_CLASS}`;
  }

  return `${open}${nextBody}${close}${rawMarkdown.slice(matched.length)}`;
}
```

Two choices worth calling out:

**Why `class` and not `footer`.** Marp has a `footer` directive that looks like the
obvious fit. Using it would consume the one footer a deck gets, so an author who
wanted their own footer would have to choose between that and the disclosure. The
`class` directive composes instead — and the code appends to any existing class list
rather than overwriting it.

**Why inside `renderSlides`.** The deck page and the PDF generator both call it:

```js
// scripts/generate-slide-pdfs.js
const { html, css } = renderSlides(rawMarkdown);
```

Putting the translation in the renderer means both paths picked it up with no call-site
change, and the disclosure can't be present on the site but missing from the
downloadable PDF.

The theme then draws it:

```css
section.ai-assisted::before {
    content: 'AI-assisted (deck)';
    position: absolute;
    right: 30px;
    /* Pagination occupies 21px-45px from the bottom; clear it with a margin. */
    bottom: 48px;
    /* ...appearance... */
}

/* Unpaginated slides have no page number to clear, so the disclosure drops
   back down to the footer baseline. */
section.ai-assisted:not([data-marpit-pagination])::before {
    bottom: 21px;
}
```

That `bottom: 48px` is a bug fix, not a guess. The first attempt put the footer at
`bottom: 21px` — the natural mirror of Marp's own footer — and it landed exactly on
top of the page number, which resolves to the same `right: 30px / bottom: 21px` slot.
It read as `AI-assisted (deck)1`. Sitting beside the number would have worked until the
count reached two digits; stacking above it works at any deck length.

## What gets tested

The first pass at tests checked that the class landed on every section. That proved
the renderer worked and nothing about whether anything was *drawn* — deleting the
theme rule left the whole suite green while the footer silently vanished.

So the assertions are on computed style, in a real browser:

| Assertion | Catches |
|---|---|
| `::before` content contains "AI-assisted" | theme rule deleted |
| disclosure box clears the page-number box | the collision above, reintroduced |
| unmarked deck has no `::before` at all | disclosure leaking onto untagged content |
| badge is `static` below 640px | narrow-screen fallback removed |
| badge `z-index` below the navbar's | badge covering the nav |

Each was mutation-tested: break the thing it guards, confirm that test and only that
test fails. A test you haven't watched fail is a test you're assuming works.

## In short

One boolean, defaulting to false, reaching two rendering pipelines through different
mechanisms — a conditional element for posts, a directive translation for decks — with
the placement rules in CSS and the regressions pinned down by computed-style
assertions.

This post has the flag set. Look at the top-right corner.
