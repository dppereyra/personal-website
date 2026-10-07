import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The Content-Security-Policy every page is served with (public/_headers).
const csp = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8')
  .split('\n')
  .find((line) => line.trim().startsWith('Content-Security-Policy:'))!
  .replace(/^\s*Content-Security-Policy:\s*/, '');

const directive = (name: string) =>
  csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `))?.split(/\s+/).slice(1) ?? [];

describe('Content-Security-Policy for New Relic Browser', () => {
  it("lets the agent send data to New Relic's US collector", () => {
    expect(directive('connect-src')).toContain('https://bam.nr-data.net');
  });

  it('allows no other New Relic host, region or wildcard', () => {
    const newRelicHosts = csp.split(/[\s;]+/).filter((token) => /newrelic|nr-data/.test(token));
    expect(newRelicHosts).toEqual(['https://bam.nr-data.net']);
  });

  it('does not load the agent from New Relic, since it is bundled with the site', () => {
    expect(directive('script-src').some((source) => /newrelic|nr-data/.test(source))).toBe(false);
  });
});
