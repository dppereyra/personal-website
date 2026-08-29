import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

import sentry from '@sentry/astro';

// DEPLOY_PRIME_URL is set by Netlify on every build (production, branch
// deploys, and PR deploy previews alike) to that specific deploy's real
// URL, so it covers all Netlify contexts without hardcoding branch names
// or domains here.
const site = process.env.SITE_URL
  ?? process.env.DEPLOY_PRIME_URL
  ?? 'http://localhost:4321';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    svelte(),
    sentry({
      enabled: !!process.env.PUBLIC_SENTRY_DSN,
      org: process.env.SENTRY_ORG,
      project: 'personal-website',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],

  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
