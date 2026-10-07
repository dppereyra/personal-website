// Only the real production site (dppereyra.com) gets a real robots.txt.
// Everything else — staging, deploy previews, branch deploys, local dev —
// is disallowed outright, so search bots don't crawl (and index, or add to
// GA hit volume) a duplicate of the real site. See src/utils/site-context.ts
// for why this compares the build's own address rather than CONTEXT or URL
// alone.
import { CANONICAL_PRODUCTION_ORIGIN, isProductionSite } from '../utils/site-context';

const isProduction = isProductionSite();

const body = isProduction
  ? `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_PRODUCTION_ORIGIN}/sitemap-index.xml\n`
  : 'User-agent: *\nDisallow: /\n';

export function GET() {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
