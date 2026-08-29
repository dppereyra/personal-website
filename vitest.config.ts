import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  getViteConfig({
    resolve: {
      conditions: ['browser'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
      setupFiles: ['./vitest.setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        include: ['src/**/*.{js,ts,svelte,astro}'],
        exclude: [
          'src/**/*.{test,spec}.{js,ts,svelte}',
          'src/env.d.ts',
          'src/content/**',
        ],
      },
    },
  })
);
