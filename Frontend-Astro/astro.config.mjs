// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';
import markdoc from '@astrojs/markdoc';
import { loadEnv } from 'vite';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import { mkdirSync, writeFileSync } from 'node:fs';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = loadEnv(import.meta.env?.MODE || 'development', path.resolve(__dirname, '..'), '');
const isBuild = process.argv.includes('build');
const devKeystaticEnv = isBuild
  ? {}
  : {
      'import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID': JSON.stringify(env.KEYSTATIC_GITHUB_CLIENT_ID || ''),
      'import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET': JSON.stringify(env.KEYSTATIC_GITHUB_CLIENT_SECRET || ''),
      'import.meta.env.KEYSTATIC_SECRET': JSON.stringify(env.KEYSTATIC_SECRET || ''),
      'import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG': JSON.stringify(env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG || '')
    };

/** @returns {import('astro').AstroIntegration} */
function keystaticUiOnly() {
  return {
    name: 'keystatic-ui-only',
    hooks: {
      'astro:config:setup': (options) => {
        const { injectRoute, updateConfig, config } = options;
        updateConfig({
          server: config.server.host ? {} : { host: '127.0.0.1' },
          vite: {
            plugins: [/** @type {import('vite').Plugin} */ ({
              name: 'keystatic',
              resolveId(id) {
                if (id === 'virtual:keystatic-config') {
                  return path.resolve(__dirname, 'keystatic.config.ts');
                }
                return null;
              }
            })],
            optimizeDeps: {
              entries: ['keystatic.config.*', '.astro/keystatic-imports.js']
            }
          }
        });

        const dotAstroDir = new URL('./.astro/', config.root);
        mkdirSync(dotAstroDir, { recursive: true });
        writeFileSync(new URL('keystatic-imports.js', dotAstroDir), `import "@keystatic/astro/ui";
import "@keystatic/astro/api";
import "@keystatic/core/ui";
`);

        injectRoute({
          entrypoint: '@keystatic/astro/internal/keystatic-astro-page.astro',
          pattern: '/keystatic/[...params]',
          prerender: false
        });
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: env.PUBLIC_SITE_URL || 'https://my-astro-site.com',
  output: 'static',
  adapter: isBuild ? cloudflare({ configPath: 'wrangler.json' }) : node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@keystatic/astro/api', '@keystatic/astro/internal/keystatic-api.js']
    },
    define: {
      ...devKeystaticEnv,
      'process.env.DECAP_GITHUB_REPO': JSON.stringify(env.DECAP_GITHUB_REPO || 'owner/repo')
    }
  },

  integrations: [
    react(),
    sitemap(),
    markdoc(),
    keystaticUiOnly(),
  ]
});
