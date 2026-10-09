import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Продуктовые страницы — конструктор из блоков.
// Файл src/content/pages/<адрес>.json → страница compo-space.ru/<адрес>
// index.json → главная.
const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    url: z.string().optional(),
    draft: z.boolean().default(false),
    form_name: z.string().optional(),
    seo: z.object({
      title: z.string(),
      description: z.string(),
      og_image: z.string().optional().nullable()
    }),
    blocks: z.array(z.object({ type: z.string() }).passthrough()).default([])
  })
});

// Блог — статьи в Markdown.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    cover: z.string().optional().nullable(),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Компо Софт'),
    draft: z.boolean().default(false)
  })
});

export const collections = { pages, blog };
