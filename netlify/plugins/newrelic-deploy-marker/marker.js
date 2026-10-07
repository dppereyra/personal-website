// Pure helpers for the New Relic deploy-marker plugin (see index.js). Kept out
// of index.js because Netlify only accepts lifecycle event handlers as exports
// of a plugin's entry module.

const PRODUCTION_ORIGINS = new Set(['https://dppereyra.com', 'https://www.dppereyra.com']);
export const NERDGRAPH = 'https://api.newrelic.com/graphql';
export const MUTATION = `mutation ($deployment: ChangeTrackingDeploymentInput!) {
  changeTrackingCreateDeployment(deployment: $deployment) { deploymentId }
}`;

// New Relic entity GUID: unpadded base64 of "account|domain|type|domain id".
export function browserEntityGuid(accountId, appId) {
  return Buffer.from(`${accountId}|BROWSER|APPLICATION|${appId}`).toString('base64').replace(/=+$/, '');
}

function isProductionDeploy(env) {
  if (env.CONTEXT !== 'production' || !env.URL) return false;
  try {
    return PRODUCTION_ORIGINS.has(new URL(env.URL).origin);
  } catch {
    return false;
  }
}

export function deploymentInput(env = process.env) {
  if (!isProductionDeploy(env)) return null;
  if (!env.NEW_RELIC_API_KEY || !env.NEW_RELIC_ACCOUNT_ID || !env.NEW_RELIC_APP_ID) return null;
  return {
    entityGuid: browserEntityGuid(env.NEW_RELIC_ACCOUNT_ID, env.NEW_RELIC_APP_ID),
    version: env.COMMIT_REF,
    commit: env.COMMIT_REF,
    deploymentType: 'BASIC',
    deepLink: env.DEPLOY_URL,
    description: `Netlify production deploy ${env.DEPLOY_ID} from ${env.BRANCH}`,
  };
}

