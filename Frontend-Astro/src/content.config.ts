import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.string().optional(),
    desc: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    layout: z.string().optional(),
  }),
});

export const collections = {
  'posts': postsCollection,
};
