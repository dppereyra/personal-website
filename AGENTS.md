# AGENTS.md

This file provides guidance to coding agents and contributors working in this repository.

## Project Overview

Personal website and blog for www.dppereyra.com built with Astro, Svelte, Tailwind CSS, and DaisyUI.

## Tech Stack

- **Framework**: Astro v5.17+ (static site generator)
- **UI Components**: Svelte v5.49+
- **Styling**: Tailwind CSS v4.1+ with DaisyUI plugin
- **Content**: Astro Content Collections for blog posts (Markdown)
- **Deployment**: Netlify
- **Node.js**: v24

## Development Commands

```bash
npm run dev              # Start development server (http://localhost:4321)
npm run full-build       # Run tests, generate resume PDF, then build for production
npm run build:site       # Type check and build the site only
npm run preview          # Preview production build locally
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Run tests with coverage report
npm run test:robot:chrome # Run Robot internal-link checks in Chrome
npm run test:robot:firefox # Run Robot internal-link checks in Firefox
npm run generate:resume  # Generate resume PDF from resume.json
```

## Agent Guidelines

- Prefer minimal, targeted changes that fit the existing Astro, Svelte, Tailwind, and DaisyUI patterns.
- Verify changes with the smallest relevant command, usually `npm test` or `npm run build:site`.
- Avoid changing generated artifacts unless the task specifically requires it.
- Keep this file as the single source of truth for repository-specific agent guidance.

## Development Environment

Uses VS Code Dev Containers with:
- Node.js v24
- Ubuntu 24.04 base image
- Netlify CLI for deployment
- Docker-outside-of-docker support

To start developing:
1. Open the project in VS Code
2. Use "Reopen in Container" command
3. Run `npm run dev` to start the development server

## Project Structure

```
src/
├── content/
│   ├── config.ts       # Content collections schema (blog posts)
│   └── blog/           # Blog post markdown files
├── layouts/
│   └── Layout.astro    # Main layout with navigation and footer
├── pages/
│   ├── index.astro     # Blog listing (homepage)
│   ├── about.astro     # About page (pulls from resume.json)
│   ├── contact.astro   # Contact page
│   ├── work.astro      # Work history (from resume.json)
│   ├── projects.astro  # Project portfolio (from resume.json)
│   └── blog/
│       └── [...slug].astro  # Dynamic blog post pages
├── styles/
│   └── global.css      # Tailwind CSS imports and DaisyUI plugin
├── types/
│   └── resume.ts       # JSON Resume schema TypeScript types
└── resume.json         # JSON Resume data (update with your info)
```

## Architecture

**Routing**: File-based routing in `src/pages/`
- `index.astro` → `/` (blog listing)
- `about.astro` → `/about` (displays info from resume.json)
- `work.astro` → `/work` (work history from resume.json)
- `projects.astro` → `/projects` (project portfolio from resume.json)
- `contact.astro` → `/contact`
- `blog/[...slug].astro` → `/blog/{slug}` (dynamic routes)

**Blog System**: Uses Astro Content Collections
- Blog posts are markdown files in `src/content/blog/`
- Schema defined in `src/content/config.ts`
- Frontmatter fields: `title`, `description`, `pubDate`, `updatedDate`, `tags`
- Posts are sorted by `pubDate` (newest first) on the homepage

**Styling**: Tailwind CSS v4 with DaisyUI
- Global styles in `src/styles/global.css`
- DaisyUI plugin configured via `@plugin "daisyui"`
- Components use DaisyUI classes (navbar, card, footer, form controls, etc.)

**Layout**: Single base layout (`Layout.astro`)
- Imports global CSS
- Provides navigation, main content slot, and footer
- All pages extend this layout

## Adding Blog Posts

Create a new markdown file in `src/content/blog/`:

```markdown
---
title: 'Post Title'
description: 'Brief description'
pubDate: 2026-02-03
tags: ['tag1', 'tag2']
---

Your markdown content here...
```

The post will automatically appear on the homepage and be accessible at `/blog/{filename}`.

## JSON Resume Integration

The site uses [JSON Resume](https://jsonresume.org/) schema for structured resume data.

**Resume File**: `src/resume.json`

**TypeScript Types**: `src/types/resume.ts` contains full JSON Resume schema types

**Pages Using Resume Data**:
- `/about` - Displays basics, skills, interests, and social profiles
- `/work` - Shows work history with positions, companies, dates, and highlights
- `/projects` - Displays project portfolio with descriptions, technologies, and links

**Updating Your Resume**:
1. Edit `src/resume.json` with your information
2. Follow the [JSON Resume schema](https://jsonresume.org/schema/)
3. Pages automatically update based on the data

**Key Resume Sections**:
- `basics` - Name, label, summary, email, profiles, location
- `work` - Employment history with highlights
- `projects` - Personal and professional projects
- `skills` - Technical skills grouped by category
- `education` - Academic background
- `certificates` - Professional certifications
- `interests` - Personal interests and hobbies

The resume data is type-safe with TypeScript interfaces matching the official JSON Resume schema.

### PDF Resume Generation

**Automatic Generation**: Resume PDF is generated automatically during `npm run full-build`

**Manual Generation**:
```bash
npm run generate:resume
```

**How it Works**:
1. `scripts/generate-resume-pdf.js` reads `src/resume.json`
2. Uses `resumed` CLI with `jsonresume-theme-even` theme
3. Generates PDF using Puppeteer (headless Chrome)
4. Outputs to `public/resume.pdf` (accessible at `/resume.pdf`)
5. Runs during `npm run full-build` before the Astro build

**Download Button**: The About page includes a download button for the PDF resume

**Theme**: Uses `jsonresume-theme-even` (professional, clean design)
- Can be changed by modifying `--theme` parameter in the script
- Other themes: `jsonresume-theme-stackoverflow`, `jsonresume-theme-elegant`, etc.
- Must install theme package: `npm install -D jsonresume-theme-<name>`

**Dependencies**:
- `resumed` - Modern JSON Resume CLI
- `puppeteer` - Headless Chrome for PDF generation
- `jsonresume-theme-even` - Resume theme

**Generated File**: `public/resume.pdf` (90KB, excluded from git)

## Testing

**Frameworks**: Vitest v4 with @testing-library/svelte, plus Robot Framework for browser E2E checks

**Configuration**: `vitest.config.ts`
- Environment: jsdom (for DOM testing)
- Globals enabled
- Browser conditions for Svelte 5 compatibility

**Running Tests**:
- Test files: `src/**/*.{test,spec}.{js,ts,svelte}`
- Utility tests: Direct unit tests (see `src/utils/formatDate.test.ts`)
- Component tests: Use wrapper components for Svelte 5 compatibility (see `src/components/Button.test.ts` and `ButtonTestWrapper.svelte`)
- Robot E2E: `npm run build:site`, `npm run preview:e2e`, then `npm run test:robot:chrome` or `npm run test:robot:firefox`

**Writing Tests**:
- For utilities: Standard Vitest tests
- For Svelte components: Create a test wrapper component (e.g., `ComponentTestWrapper.svelte`) to work around Svelte 5 snippet/render limitations in testing-library
- Coverage reports: Generated in `coverage/` directory
- For browser E2E: Robot Framework crawls internal links from the built site and verifies they do not resolve to 404 pages in both Chrome and Firefox

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`):
- Runs on all pushes to `production`/`staging`/`master` and on all pull requests
- **Jobs:**
 - `lint-and-typecheck`: Runs `astro check` for type checking
  - `test`: Runs Vitest tests
  - `e2e-robot`: Runs Robot Framework internal-link checks in Chrome and Firefox against the built site
   - `build`: Runs the full production build to verify tests, PDF generation, and site build all succeed

**Pull Request Requirements:**
All PRs must pass:
1. Type checking (Astro check)
2. All tests passing
3. Build succeeds

**Dependabot** (`.github/dependabot.yml`):
- Monitors npm dependencies and GitHub Actions weekly
- Opens PRs for outdated/vulnerable dependencies (`open-pull-requests-limit: 10`)
- Also shows security alerts in the Security tab
- Replaces the previous SonarQube-based dependency/quality checks as this project's automated dependency safety net

**Coverage Reports**:
- Generated locally by Vitest (`npm run test:coverage`) in multiple formats (text, JSON, HTML, LCOV)
- Not uploaded as a CI artifact; run locally when you need to inspect coverage
- Excludes test files and content collections from coverage

## Code Conventions

- 2-space indentation (enforced by `.editorconfig`)
- UTF-8 encoding
- Trim trailing whitespace
- Insert final newline

## Deployment

Configured for Netlify deployment via netlify-cli. The site is configured for www.dppereyra.com domain.

**Branch Roles**:
- `master` - development/local branch, not deployed anywhere critical
- `staging` - staging branch/site, protected
- `production` - production branch/site, protected

**Promotion flow**: changes land on `master` first, then flow forward one branch at a time via pull request — never push or merge directly into `staging` or `production`:
1. PR from `master` → `staging`
2. Once verified on staging, PR from `staging` → `production`

`staging` and `production` are configured as protected branches, so direct pushes are rejected and this PR-based promotion is the only way changes reach them.
