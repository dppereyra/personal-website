# personal-website

[![CI](https://img.shields.io/github/actions/workflow/status/dppereyra/personal-website/ci.yml?branch=master&label=CI&logo=githubactions&logoColor=white)](https://github.com/dppereyra/personal-website/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/github/license/dppereyra/personal-website?color=blue)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Deployed on Netlify](https://img.shields.io/badge/deployed_on-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com)

Personal website and blog built with Astro, Svelte, Tailwind CSS, and DaisyUI.

🌐 **Live Site**: [www.dppereyra.com](https://www.dppereyra.com)

## Features

- 📝 Blog with Markdown support via Astro Content Collections
- 🎨 Styled with Tailwind CSS and DaisyUI components
- ⚡ Fast static site generation with Astro
- ✉️ Working contact form via Netlify Forms (AJAX submission with success/error feedback)
- 🖼️ Profile image sourced from Gravatar
- 🧪 Comprehensive testing with Vitest and Robot Framework
- 🔄 CI/CD with GitHub Actions
- 🔒 Automated dependency vulnerability checks with Dependabot

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Install Robot Framework dependencies for browser E2E checks
npm run test:robot:install

# Build for production
npm run full-build
```

## Robot E2E

Install the Python dependencies once before running the browser checks locally:

```bash
npm run test:robot:install
```

This creates a local virtual environment in `.venv-robot` so Robot dependencies do not need to be installed into the system Python.

Then build and preview the site in one terminal:

```bash
npm run build:site
npm run preview:e2e
```

Run the Robot suite in another terminal:

```bash
PATH="$(pwd)/.venv-robot/bin:$PATH" npm run test:robot:chrome
PATH="$(pwd)/.venv-robot/bin:$PATH" npm run test:robot:firefox
```

## Local CI with act

Use [`act`](https://github.com/nektos/act) to run most GitHub Actions jobs locally.

### Prerequisites

```bash
# Install Docker Desktop and make sure it is running

# Install act
brew install act
```

This repository includes a local `.actrc` that maps `ubuntu-latest` to a fuller runner image:

```text
-P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest
```

On Apple Silicon Macs, also pass `--container-architecture linux/amd64` when running `act`.

### Optional local secrets

Most local runs do not need real secrets, but the `build` job reads GitHub Actions secrets. Create a local secrets file if you want to exercise that job with `act`:

```bash
cp .secrets.act.example .secrets.act
```

Empty `PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, and `PUBLIC_GA_MEASUREMENT_ID` values are fine for most local `act` runs.

### Recommended jobs

These jobs should be the most useful and reliable to run locally:

```bash
act -j lint-and-typecheck
act -j test
act -j build --secret-file .secrets.act
```

On Apple Silicon:

```bash
act --container-architecture linux/amd64 -j lint-and-typecheck
act --container-architecture linux/amd64 -j test
act --container-architecture linux/amd64 -j build --secret-file .secrets.act
```

### Robot E2E job

You can try the browser-based CI job with:

```bash
act -j e2e-robot
```

On Apple Silicon:

```bash
act --container-architecture linux/amd64 -j e2e-robot
```

This job is more likely to fail locally because it depends on container browser setup for Chrome and Firefox. If that happens, use the native local Robot flow in the section above instead.

### Full workflow

You can attempt the full workflow with:

```bash
act
```

For this repository, `act` is usually most effective when run job-by-job, especially if you want fast feedback or want to avoid browser setup issues.

## Development

See [AGENTS.md](./AGENTS.md) for detailed development guide, architecture, and conventions.

## Deployment

Changes are promoted forward one branch at a time via pull request:

1. **PR from `master` → `staging`**
2. **PR from `staging` → `production`**, once verified on staging

`master` is development/local only. `staging` and `production` are protected branches — direct pushes are rejected, so this PR-based flow is the only way changes reach them.

## CI/CD

All pull requests automatically run:
- Type checking with Astro
- Unit tests with Vitest
- Browser E2E checks with Robot Framework in Chrome and Firefox
- Full production build verification, including resume PDF generation
- Dependabot dependency vulnerability scanning (`.github/dependabot.yml`)

## License

Licensed under the [Apache License 2.0](./LICENSE).
