import { afterEach, describe, expect, it, vi } from 'vitest';

// robots.txt.ts decides production vs not at module load, so each case stubs
// URL first and imports a fresh copy of the module.
async function robotsFor(url: string | undefined): Promise<string> {
  vi.resetModules();
  vi.stubEnv('URL', url);
  const { GET } = await import('../pages/robots.txt');
  return GET().text();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('robots.txt', () => {
  it('lets crawlers in and points them at the sitemap on the production site', async () => {
    const body = await robotsFor('https://www.dppereyra.com');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap: https://www.dppereyra.com/sitemap-index.xml');
  });

  it('advertises the canonical www sitemap even when built from the apex origin', async () => {
    const body = await robotsFor('https://dppereyra.com');
    expect(body).toContain('Sitemap: https://www.dppereyra.com/sitemap-index.xml');
  });

  it.each([
    ['staging', 'https://www-dppereyra-staging.netlify.app'],
    ['a deploy preview', 'https://deploy-preview-55--www-dppereyra-staging.netlify.app'],
    ['a local build', undefined],
  ])('disallows everything and names no sitemap on %s', async (_label, url) => {
    const body = await robotsFor(url);
    expect(body).toContain('Disallow: /');
    expect(body).not.toContain('Sitemap:');
  });
});
