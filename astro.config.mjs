// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://my-astro-site.com',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    react(),
    sitemap(),
    starlight({
      title: 'Docs',
    }),
  ]
});