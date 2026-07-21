import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

import sentry from '@sentry/astro';

const site = process.env.SITE_URL
  ?? (process.env.BRANCH === 'staging'
    ? 'https://dpp-site-staging.netlify.app'
    : 'https://www.dppereyra.com');

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    svelte(),
    sentry({
      enabled: !!process.env.PUBLIC_SENTRY_DSN,
      sourceMapsUploadOptions: {
        project: 'personal-website',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
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
