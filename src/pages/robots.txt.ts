// Only the real production site (dppereyra.com) gets a real robots.txt.
// Everything else — staging, deploy previews, branch deploys, local dev —
// is disallowed outright, so search bots don't crawl (and index, or add to
// GA hit volume) a duplicate of the real site. See src/utils/site-context.ts
// for why this can't be a plain `CONTEXT === 'production'` check: Netlify
// reports CONTEXT as 'production' for staging's own production-context
// build too, not just the real production site's.
import { isProductionSite } from '../utils/site-context';

const isProduction = isProductionSite();

const body = isProduction
  ? 'User-agent: *\nAllow: /\n'
  : 'User-agent: *\nDisallow: /\n';

export function GET() {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
