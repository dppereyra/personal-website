// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onBuild } from './index.js';

describe('emails-commonjs build plugin', () => {
  const originalCwd = process.cwd();
  let workdir;

  beforeEach(() => {
    workdir = mkdtempSync(join(tmpdir(), 'emails-commonjs-'));
    process.chdir(workdir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(workdir, { recursive: true, force: true });
  });

  it('scopes the generated emails function as CommonJS', () => {
    const functionDir = join('.netlify', 'functions-internal', 'emails');
    mkdirSync(functionDir, { recursive: true });
    writeFileSync(join(functionDir, 'index.js'), '"use strict";\nexports.handler = () => {};\n');

    onBuild();

    const packageJson = JSON.parse(readFileSync(join(functionDir, 'package.json'), 'utf8'));
    expect(packageJson).toEqual({ type: 'commonjs' });
  });

  it('does nothing when the emails plugin did not generate a function', () => {
    onBuild();

    expect(existsSync(join('.netlify', 'functions-internal', 'emails'))).toBe(false);
  });
});
