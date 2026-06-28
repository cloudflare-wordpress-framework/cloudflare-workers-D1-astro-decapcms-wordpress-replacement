// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
<<<<<<< HEAD
  site: 'https://my-astro-site.vnvdacloudlear.workers.dev/',
=======
  site: 'https://my-astro-site.com',
>>>>>>> f54e89099a896ef7776f2d7258f67586c7e21c48
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