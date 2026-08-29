import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

import sentry from '@sentry/astro';

// Netlify sets CONTEXT to 'production' only for builds off a site's own
// configured Production branch (confirmed via `netlify api getSite`: the
// staging site's Production branch is `staging`, the production site's is
// `production` — each site's git branch naming lines up with its own
// Netlify "production" context, not the repo's branch names in general).
//
// For that context, URL is the right variable: Netlify documents it as
// always the site's stable primary address (the custom domain if one is
// configured, e.g. dppereyra.com for the production site; otherwise the
// default *.netlify.app domain, e.g. www-dppereyra-staging.netlify.app for
// staging) — unlike DEPLOY_PRIME_URL, which for a "production context"
// deploy has been observed resolving to an ephemeral branch-alias
// subdomain (staging--www-dppereyra-staging.netlify.app) instead of the
// stable one, breaking anything (like RSS item links/guids) that needs a
// permanent URL.
//
// For every other context (deploy-preview, branch-deploy) DEPLOY_PRIME_URL
// is correct and is what we want: that build's own specific address, which
// is what a visitor is actually looking at.
const context = process.env.CONTEXT;
const site = process.env.SITE_URL
  ?? (context === 'production' ? process.env.URL : process.env.DEPLOY_PRIME_URL)
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
