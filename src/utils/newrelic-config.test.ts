import { describe, expect, it } from 'vitest';
import { buildNewRelicOptions, newRelicEnvironment } from './newrelic-config';
import { NEW_RELIC_OBFUSCATE } from './newrelic-obfuscate';

const KEYS = {
  NEW_RELIC_ACCOUNT_ID: '1111111',
  NEW_RELIC_TRUST_KEY: '1111111',
  NEW_RELIC_AGENT_ID: '2222222222',
  NEW_RELIC_APP_ID: '2222222222',
  NEW_RELIC_LICENSE_KEY: 'NRJS-0000000000000000000',
};
const PRODUCTION = { ...KEYS, CONTEXT: 'production', URL: 'https://www.dppereyra.com', DEPLOY_PRIME_URL: 'https://production--dppereyra-website.netlify.app', BRANCH: 'production', COMMIT_REF: 'abc123def456' };
const STAGING_BRANCH = { ...KEYS, CONTEXT: 'branch-deploy', URL: 'https://www.dppereyra.com', DEPLOY_PRIME_URL: 'https://staging--dppereyra-website.netlify.app', BRANCH: 'staging', COMMIT_REF: 'fedcba987654' };
const PREVIEW = { ...KEYS, CONTEXT: 'deploy-preview', URL: 'https://www.dppereyra.com', DEPLOY_PRIME_URL: 'https://deploy-preview-70--dppereyra-website.netlify.app', BRANCH: 'feature-x', COMMIT_REF: '0123456789ab' };
const LEGACY_STAGING_SITE = { ...KEYS, CONTEXT: 'production', URL: 'https://www-dppereyra-staging.netlify.app', DEPLOY_PRIME_URL: 'https://staging--www-dppereyra-staging.netlify.app', BRANCH: 'staging', COMMIT_REF: '999999999999' };

describe('newRelicEnvironment', () => {
  it.each([
    ['production', PRODUCTION, 'production'],
    ['staging', STAGING_BRANCH, 'staging'],
    ['preview', PREVIEW, 'preview'],
    ['staging', LEGACY_STAGING_SITE, 'staging'],
  ])('tags a %s build correctly', (_label, env, expected) => {
    expect(newRelicEnvironment(env)).toBe(expected);
  });
});

describe('buildNewRelicOptions', () => {
  it('returns nothing outside a Netlify build, so local builds load no agent', () => {
    expect(buildNewRelicOptions({ ...KEYS })).toBeNull();
  });

  it.each(Object.keys(KEYS))('returns nothing when %s is missing', (key) => {
    const env: Record<string, string> = { ...PRODUCTION };
    delete env[key];
    expect(buildNewRelicOptions(env)).toBeNull();
  });

  it('tags events with the environment and the commit as the release', () => {
    expect(buildNewRelicOptions(STAGING_BRANCH)).toMatchObject({ environment: 'staging', release: 'fedcba987654' });
    expect(buildNewRelicOptions(PRODUCTION)).toMatchObject({ environment: 'production', release: 'abc123def456' });
  });

  it('points the agent at the US collector and the Browser app', () => {
    const options = buildNewRelicOptions(PRODUCTION)!;
    expect(options.info).toMatchObject({ beacon: 'bam.nr-data.net', errorBeacon: 'bam.nr-data.net', applicationID: '2222222222', licenseKey: 'NRJS-0000000000000000000' });
    expect(options.loader_config).toMatchObject({ accountID: '1111111', trustKey: '1111111', agentID: '2222222222', applicationID: '2222222222', licenseKey: 'NRJS-0000000000000000000' });
  });

  it('keeps data collection minimal: no cookies, replay, traces, user actions, logs or payloads', () => {
    const { init } = buildNewRelicOptions(PRODUCTION)!;
    expect(init.privacy).toEqual({ cookies_enabled: false });
    for (const feature of ['session_replay', 'session_trace', 'soft_navigations', 'generic_events', 'user_actions', 'page_action', 'logging'] as const) {
      expect(init[feature], feature).toMatchObject({ enabled: false });
    }
    expect(init.distributed_tracing).toMatchObject({ enabled: false });
    expect(init.ajax).toMatchObject({ enabled: true, capture_payloads: 'none' });
  });
});

describe('NEW_RELIC_OBFUSCATE', () => {
  const scrub = (text: string) =>
    NEW_RELIC_OBFUSCATE.reduce((acc, rule) => acc.replace(rule.regex, rule.replacement), text);

  it('drops query strings and fragments from URLs', () => {
    expect(scrub('https://www.dppereyra.com/blog/?ref=x&utm_source=y#section')).toBe('https://www.dppereyra.com/blog/');
  });

  it('redacts email addresses', () => {
    expect(scrub('mailto:someone@example.com failed')).toBe('mailto:[email] failed');
  });

  it('leaves ordinary paths alone', () => {
    expect(scrub('https://www.dppereyra.com/slides/welcome/')).toBe('https://www.dppereyra.com/slides/welcome/');
  });
});
