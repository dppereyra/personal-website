/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Sentry Configuration
  readonly PUBLIC_SENTRY_DSN?: string;
  readonly SENTRY_AUTH_TOKEN?: string;

  // Google Analytics Configuration
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;

  // Node Environment
  readonly NODE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
