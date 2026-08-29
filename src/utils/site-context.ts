// Single source of truth for "is this build actually serving the real,
// public production site" (dppereyra.com) — used to gate anything that
// should differ between the real site and every non-production surface
// (staging, deploy previews, branch deploys, local dev): noindex tagging
// today, potentially other production-only behavior later.
//
// Netlify's CONTEXT env var is 'production' for ANY site's own configured
// Production branch build — including the staging Netlify site's (whose
// Production branch is `staging`), not just the real production site's
// (whose Production branch is `production`). See astro.config.mjs's `site`
// comment for the full reasoning. So CONTEXT alone cannot distinguish "the
// real public site" from "staging's own production-context build" — both
// report CONTEXT === 'production'. Comparing the resolved URL's origin
// against the one known production origin is the reliable check.
const PRODUCTION_ORIGINS = new Set([
  'https://dppereyra.com',
  'https://www.dppereyra.com',
]);

export function isProductionSite(url = process.env.URL): boolean {
  if (!url) return false;
  try {
    return PRODUCTION_ORIGINS.has(new URL(url).origin);
  } catch {
    return false;
  }
}
