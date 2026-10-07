import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import sentry from '@sentry/astro';

import { isProductionSite, resolveSiteUrl } from './src/utils/site-context';

// The address this build serves; see resolveSiteUrl for how each Netlify
// context maps to it.
const site = resolveSiteUrl();

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    svelte(),
    // Only the real production site publishes a sitemap. Every other surface
    // is disallowed in robots.txt, and a sitemap there would advertise its
    // staging or preview hostname.
    ...(isProductionSite(site) ? [sitemap()] : []),
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
