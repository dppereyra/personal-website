import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import sentry from '@sentry/astro';

import { isProductionSite, resolveSiteUrl } from './src/utils/site-context';
import { buildNewRelicOptions } from './src/utils/newrelic-config';

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
    // New Relic Browser settings for this build, or null to ship no agent;
    // read by src/scripts/newrelic.ts.
    define: {
      __NEW_RELIC__: JSON.stringify(buildNewRelicOptions()),
    },
  },
});
