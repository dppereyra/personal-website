// Build-time configuration for the New Relic Browser agent. astro.config.mjs
// evaluates this once per build and hands the result to the page script
// (src/scripts/newrelic.ts) as __NEW_RELIC__; null means "load no agent".
//
// All five values come from the Browser app's copy/paste snippet and are
// public by design: they ship in every page and only let a browser send
// telemetry to this one app. They are not secrets.
import { isProductionSite, resolveSiteUrl } from './site-context';

type Env = Partial<Record<string, string>>;

// New Relic's US datacenter; the CSP in public/_headers allows only this host.
const BEACON = 'bam.nr-data.net';

const REQUIRED = [
  'NEW_RELIC_ACCOUNT_ID',
  'NEW_RELIC_TRUST_KEY',
  'NEW_RELIC_AGENT_ID',
  'NEW_RELIC_APP_ID',
  'NEW_RELIC_LICENSE_KEY',
] as const;

export type NewRelicEnvironment = 'production' | 'staging' | 'preview';

export interface NewRelicOptions {
  environment: NewRelicEnvironment;
  release: string;
  info: { beacon: string; errorBeacon: string; licenseKey: string; applicationID: string; sa: number };
  loader_config: { accountID: string; trustKey: string; agentID: string; licenseKey: string; applicationID: string };
  init: Record<string, Record<string, unknown>>;
}

// One Browser app serves every environment; this tag tells them apart.
export function newRelicEnvironment(env: Env = process.env): NewRelicEnvironment {
  if (isProductionSite(resolveSiteUrl(env))) return 'production';
  if (env.CONTEXT === 'deploy-preview') return 'preview';
  return 'staging';
}

export function buildNewRelicOptions(env: Env = process.env): NewRelicOptions | null {
  // Only Netlify builds report; local and CI builds never load the agent.
  if (!env.CONTEXT) return null;
  if (REQUIRED.some((key) => !env[key])) return null;

  const licenseKey = env.NEW_RELIC_LICENSE_KEY!;
  const applicationID = env.NEW_RELIC_APP_ID!;

  return {
    environment: newRelicEnvironment(env),
    release: env.COMMIT_REF ?? 'unknown',
    info: { beacon: BEACON, errorBeacon: BEACON, licenseKey, applicationID, sa: 1 },
    loader_config: {
      accountID: env.NEW_RELIC_ACCOUNT_ID!,
      trustKey: env.NEW_RELIC_TRUST_KEY!,
      agentID: env.NEW_RELIC_AGENT_ID!,
      licenseKey,
      applicationID,
    },
    // Page views, timings, JS errors, AJAX timings and metrics only. Nothing
    // that records what a visitor does or sets a cookie.
    init: {
      privacy: { cookies_enabled: false },
      ajax: { enabled: true, deny_list: [BEACON], capture_payloads: 'none' },
      distributed_tracing: { enabled: false },
      session_replay: { enabled: false },
      session_trace: { enabled: false },
      soft_navigations: { enabled: false },
      generic_events: { enabled: false },
      user_actions: { enabled: false },
      page_action: { enabled: false },
      logging: { enabled: false },
    },
  };
}
