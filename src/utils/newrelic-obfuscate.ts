// Scrubbing rules applied by the New Relic Browser agent to every string it
// sends (URLs, error messages). Query strings and fragments can carry campaign
// or personal parameters, and error text can quote an email address; neither
// is needed to read performance or error data. Kept apart from
// newrelic-config.ts so the browser bundle pulls in no build-time code.
export const NEW_RELIC_OBFUSCATE: { regex: RegExp; replacement: string }[] = [
  { regex: /[?#][^\s"']*/g, replacement: '' },
  { regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: '[email]' },
];
