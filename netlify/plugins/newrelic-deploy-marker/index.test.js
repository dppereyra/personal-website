import { afterEach, describe, expect, it, vi } from 'vitest';
import * as plugin from './index.js';
import { onSuccess } from './index.js';
import { browserEntityGuid, deploymentInput } from './marker.js';

const NR = { NEW_RELIC_API_KEY: 'NRAK-TEST', NEW_RELIC_ACCOUNT_ID: '1111111', NEW_RELIC_APP_ID: '2222222222' };
const PRODUCTION = { ...NR, CONTEXT: 'production', URL: 'https://www.dppereyra.com', COMMIT_REF: 'abc123def4567890', BRANCH: 'production', DEPLOY_URL: 'https://6ac5-dppereyra-website.netlify.app', DEPLOY_ID: '6ac5' };
// The current separate staging site also builds in the 'production' context.
const LEGACY_STAGING_SITE = { ...PRODUCTION, URL: 'https://www-dppereyra-staging.netlify.app', BRANCH: 'staging' };
const STAGING_BRANCH = { ...PRODUCTION, CONTEXT: 'branch-deploy', BRANCH: 'staging' };
const PREVIEW = { ...PRODUCTION, CONTEXT: 'deploy-preview', BRANCH: 'feature-x' };

// Netlify refuses to load a plugin whose entry module exports anything other
// than lifecycle event handlers, so helpers live in marker.js.
describe('plugin entry module', () => {
  it('exports only Netlify build event handlers', () => {
    const events = ['onPreBuild', 'onBuild', 'onPostBuild', 'onSuccess', 'onError', 'onEnd'];
    expect(Object.keys(plugin).filter((name) => !events.includes(name))).toEqual([]);
  });
});

describe('browserEntityGuid', () => {
  it("builds New Relic's entity GUID for the Browser app", () => {
    expect(browserEntityGuid('1111111', '2222222222')).toBe(
      Buffer.from('1111111|BROWSER|APPLICATION|2222222222').toString('base64').replace(/=+$/, ''),
    );
  });
});

describe('deploymentInput', () => {
  it('describes a production deploy: commit as version, deploy link, branch', () => {
    expect(deploymentInput(PRODUCTION)).toEqual({
      entityGuid: browserEntityGuid('1111111', '2222222222'),
      version: 'abc123def4567890',
      commit: 'abc123def4567890',
      deploymentType: 'BASIC',
      deepLink: 'https://6ac5-dppereyra-website.netlify.app',
      description: 'Netlify production deploy 6ac5 from production',
    });
  });

  it.each([
    ['the staging branch deploy', STAGING_BRANCH],
    ['a deploy preview', PREVIEW],
    ['the separate staging site', LEGACY_STAGING_SITE],
  ])('records nothing for %s', (_label, env) => {
    expect(deploymentInput(env)).toBeNull();
  });

  it.each(Object.keys(NR))('records nothing when %s is missing', (key) => {
    const env = { ...PRODUCTION };
    delete env[key];
    expect(deploymentInput(env)).toBeNull();
  });
});

describe('onSuccess', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const stubEnv = (env) => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  };

  it('sends one NerdGraph mutation with the API key in a header, not the URL', async () => {
    stubEnv(PRODUCTION);
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { changeTrackingCreateDeployment: { deploymentId: 'd-1' } } }) });
    vi.stubGlobal('fetch', fetch);
    await onSuccess();
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.newrelic.com/graphql');
    expect(url).not.toContain('NRAK');
    expect(init.headers['API-Key']).toBe('NRAK-TEST');
    const body = JSON.parse(init.body);
    expect(body.query).toContain('changeTrackingCreateDeployment');
    expect(body.variables.deployment).toEqual(deploymentInput(PRODUCTION));
  });

  it('makes no request outside production', async () => {
    stubEnv(STAGING_BRANCH);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await onSuccess();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never fails the deploy when New Relic is unreachable or rejects the marker', async () => {
    stubEnv(PRODUCTION);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(onSuccess()).resolves.toBeUndefined();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ errors: [{ message: 'denied' }] }) }));
    await expect(onSuccess()).resolves.toBeUndefined();
  });

  it('never logs the API key', async () => {
    stubEnv(PRODUCTION);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await onSuccess();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { changeTrackingCreateDeployment: { deploymentId: 'd-1' } } }) }));
    await onSuccess();
    const output = [...warn.mock.calls, ...log.mock.calls].flat().map(String).join('\n');
    expect(output).not.toContain('NRAK-TEST');
  });
});
