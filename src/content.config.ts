import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// YAML turns `updated: 2026-08-14` into a Date and a quoted date into a string; both become YYYY-MM-DD.
const isoDate = z.coerce.date().transform((d) => d.toISOString().slice(0, 10));

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    created: isoDate.optional(),
    updated: isoDate,
  }),
});

export const collections = { notes };
