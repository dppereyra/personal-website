// Starts the New Relic Browser agent when the build supplied a configuration
// (see src/utils/newrelic-config.ts). When __NEW_RELIC__ is null the bundler
// drops this branch, and with it the agent, from the page entirely.
import { NEW_RELIC_OBFUSCATE } from '../utils/newrelic-obfuscate';

if (__NEW_RELIC__) {
  // Monitoring must never break the page: a failed import or init is logged,
  // not left as an unhandled rejection.
  start(__NEW_RELIC__).catch((error: unknown) => {
    console.warn('New Relic Browser agent failed to start', error);
  });
}

async function start(options: NonNullable<typeof __NEW_RELIC__>) {
  const [{ Agent }, { PageViewEvent }, { PageViewTiming }, { JSErrors }, { Ajax }, { Metrics }] = await Promise.all([
    import('@newrelic/browser-agent/loaders/agent'),
    import('@newrelic/browser-agent/features/page_view_event'),
    import('@newrelic/browser-agent/features/page_view_timing'),
    import('@newrelic/browser-agent/features/jserrors'),
    import('@newrelic/browser-agent/features/ajax'),
    import('@newrelic/browser-agent/features/metrics'),
  ]);

  const agent = new Agent({
    info: options.info,
    loader_config: options.loader_config,
    init: { ...options.init, obfuscate: NEW_RELIC_OBFUSCATE },
    features: [PageViewEvent, PageViewTiming, JSErrors, Ajax, Metrics],
  });
  agent.setCustomAttribute('environment', options.environment);
  agent.setApplicationVersion(options.release);
}
