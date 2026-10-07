// Single source of truth for "is this build actually serving the real,
// public production site" (dppereyra.com) — used to gate anything that
// should differ between the real site and every non-production surface
// (staging, deploy previews, branch deploys, local dev): noindex tagging
// today, potentially other production-only behavior later.
//
// Neither Netlify variable answers that on its own. CONTEXT is 'production'
// for any Netlify site's own production-branch build, not only the real one.
// URL is a project's primary domain for EVERY build of that project, so on a
// single project serving both production and the `staging` branch deploy,
// staging's URL is www.dppereyra.com too. The reliable check is the address
// this particular build actually serves (resolveSiteUrl) compared against the
// known production origins.
const PRODUCTION_ORIGINS = new Set([
  'https://dppereyra.com',
  'https://www.dppereyra.com',
]);

// The origin the production site actually serves from: the apex 301s here,
// and RSS and the sitemap emit it. Use it for anything that must name the
// real site regardless of which origin a build was given.
export const CANONICAL_PRODUCTION_ORIGIN = 'https://www.dppereyra.com';

type SiteEnv = Partial<Record<'SITE_URL' | 'CONTEXT' | 'URL' | 'DEPLOY_PRIME_URL', string>>;

// The address this build serves; astro.config.mjs uses it as Astro's `site`.
// A production-context build serves the project's stable primary domain
// (URL); DEPLOY_PRIME_URL there can be an ephemeral branch alias, which would
// break permanent links such as RSS guids. Every other context (branch
// deploys such as `staging`, deploy previews) serves its own address,
// DEPLOY_PRIME_URL. SITE_URL overrides both, e.g. for a local production build.
export function resolveSiteUrl(env: SiteEnv = process.env): string {
  return env.SITE_URL
    ?? (env.CONTEXT === 'production' ? env.URL : env.DEPLOY_PRIME_URL)
    ?? 'http://localhost:4321';
}

export function isProductionSite(url: string | undefined = resolveSiteUrl()): boolean {
  if (!url) return false;
  try {
    return PRODUCTION_ORIGINS.has(new URL(url).origin);
  } catch {
    return false;
  }
}
