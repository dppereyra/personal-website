# personal-website

[![CI](https://github.com/dppereyra/personal-website/actions/workflows/ci.yml/badge.svg)](https://github.com/dppereyra/personal-website/actions/workflows/ci.yml)

Personal website and blog built with Astro, Svelte, Tailwind CSS, and DaisyUI.

🌐 **Live Site**: [www.dppereyra.com](https://www.dppereyra.com)

## Features

- 📝 Blog with Markdown support via Astro Content Collections
- 🎨 Styled with Tailwind CSS and DaisyUI components
- ⚡ Fast static site generation with Astro
- 🧪 Comprehensive testing with Vitest and Robot Framework
- 🔄 CI/CD with GitHub Actions
- 📊 Code quality monitoring with SonarQube
- 🔒 Automated security alerts with Dependabot

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

## Development

See [AGENTS.md](./AGENTS.md) for detailed development guide, architecture, and conventions.

## CI/CD

All pull requests automatically run:
- Type checking with Astro
- Unit tests with Vitest
- Browser E2E checks with Robot Framework in Chrome and Firefox
- Full production build verification, including resume PDF generation
- Code quality analysis with SonarQube

## License

Personal project - All rights reserved
