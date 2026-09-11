import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: postSchema,
});

const slides = defineCollection({
  loader: glob({
    base: './src/content/slides',
    pattern: '**/*.md',
  }),
  schema: postSchema,
});

export const collections = { blog, slides };
