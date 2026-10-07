import { afterEach, describe, expect, it, vi } from 'vitest';
import { isProductionSite, resolveSiteUrl } from './site-context';

// Netlify environments as each kind of build sees them. On a single Netlify
// project, URL is the project's primary domain for EVERY build, so it cannot
// on its own say whether a build is production.
const PRODUCTION = { CONTEXT: 'production', URL: 'https://www.dppereyra.com', DEPLOY_PRIME_URL: 'https://production--dppereyra-website.netlify.app' };
const STAGING_BRANCH = { CONTEXT: 'branch-deploy', URL: 'https://www.dppereyra.com', DEPLOY_PRIME_URL: 'https://staging--dppereyra-website.netlify.app' };
const DEPLOY_PREVIEW = { CONTEXT: 'deploy-preview', URL: 'https://www.dppereyra.com', DEPLOY_PRIME_URL: 'https://deploy-preview-70--dppereyra-website.netlify.app' };
const LEGACY_STAGING_SITE = { CONTEXT: 'production', URL: 'https://www-dppereyra-staging.netlify.app', DEPLOY_PRIME_URL: 'https://staging--www-dppereyra-staging.netlify.app' };

describe('resolveSiteUrl', () => {
  it('uses the primary domain for a production-context build', () => {
    expect(resolveSiteUrl(PRODUCTION)).toBe('https://www.dppereyra.com');
  });

  it('uses the branch address for the staging branch deploy, not the primary domain', () => {
    expect(resolveSiteUrl(STAGING_BRANCH)).toBe('https://staging--dppereyra-website.netlify.app');
  });

  it('uses the preview address for a deploy preview', () => {
    expect(resolveSiteUrl(DEPLOY_PREVIEW)).toBe('https://deploy-preview-70--dppereyra-website.netlify.app');
  });

  it('honours an explicit SITE_URL override', () => {
    expect(resolveSiteUrl({ ...STAGING_BRANCH, SITE_URL: 'https://example.test' })).toBe('https://example.test');
  });

  it('falls back to the local dev server outside Netlify', () => {
    expect(resolveSiteUrl({})).toBe('http://localhost:4321');
  });
});

describe('isProductionSite', () => {
  it('is true only for the production build of the real site', () => {
    expect(isProductionSite(resolveSiteUrl(PRODUCTION))).toBe(true);
  });

  it.each([
    ['the staging branch deploy on the single project', STAGING_BRANCH],
    ['a deploy preview on the single project', DEPLOY_PREVIEW],
    ['the legacy separate staging site', LEGACY_STAGING_SITE],
    ['a local build', {}],
  ])('is false for %s', (_label, env) => {
    expect(isProductionSite(resolveSiteUrl(env))).toBe(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to the resolved site of the current build, not the raw URL variable', () => {
    for (const [key, value] of Object.entries(STAGING_BRANCH)) vi.stubEnv(key, value);
    vi.stubEnv('SITE_URL', undefined);
    expect(isProductionSite()).toBe(false);
  });
});
