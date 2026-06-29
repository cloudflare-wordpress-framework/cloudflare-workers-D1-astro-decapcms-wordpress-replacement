import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: (process.env.DECAP_GITHUB_REPO || 'owner/repo') as `${string}/${string}`,
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'Frontend-Astro/src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' } }),
        desc: fields.text({ label: 'Description', multiline: true }),
        image: fields.text({ label: 'Image URL' }),
        content: fields.markdoc({ label: 'Content', extension: 'md' }),
      },
    }),
  },
});
