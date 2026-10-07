// Records each successful production deploy as a New Relic change marker on
// the Browser app, so shifts in page performance or errors line up with the
// release that caused them.
//
// Only the real production site records markers. Like src/utils/site-context.ts,
// that means a production-context build whose URL is the production origin:
// the current separate staging site also builds in the 'production' context,
// and on a single Netlify project branch deploys and previews never do.
//
// NEW_RELIC_API_KEY is a New Relic User key (NRAK-…). It is a secret Netlify
// variable, sent only in a request header, and never logged. A failure here is
// reported as a warning and never fails the deploy.

import { deploymentInput, MUTATION, NERDGRAPH } from './marker.js';

export async function onSuccess() {
  const deployment = deploymentInput();
  if (!deployment) return;
  try {
    const response = await fetch(NERDGRAPH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'API-Key': process.env.NEW_RELIC_API_KEY },
      body: JSON.stringify({ query: MUTATION, variables: { deployment } }),
    });
    const result = await response.json();
    const id = result?.data?.changeTrackingCreateDeployment?.deploymentId;
    if (!response.ok || result?.errors?.length || !id) {
      const reason = result?.errors?.map((e) => e.message).join('; ') || `HTTP ${response.status}`;
      console.warn(`New Relic deploy marker not recorded: ${reason}`);
      return;
    }
    console.log(`New Relic deploy marker recorded for ${deployment.version} (${id})`);
  } catch (error) {
    console.warn(`New Relic deploy marker not recorded: ${error instanceof Error ? error.message : String(error)}`);
  }
}
