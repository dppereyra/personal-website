#!/usr/bin/env node

/**
 * Generate PDF resume from resume.json using JSON Resume CLI
 * Output is placed in public/ directory for static serving
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Paths
const resumeJsonPath = join(projectRoot, 'src', 'resume.json');
const publicDir = join(projectRoot, 'public');
const outputPdfPath = join(publicDir, 'resume.pdf');

console.log('📄 Generating resume PDF from resume.json...');

// Ensure public directory exists
if (!existsSync(publicDir)) {
  console.log('📁 Creating public directory...');
  mkdirSync(publicDir, { recursive: true });
}

// Check if resume.json exists
if (!existsSync(resumeJsonPath)) {
  console.error('❌ Error: resume.json not found at', resumeJsonPath);
  process.exit(1);
}

try {
  // Ensure Puppeteer's Chrome build is actually present before resumed tries to
  // launch it. Relying solely on Puppeteer's own postinstall script is fragile
  // on hosts with a persistent build cache (e.g. Netlify's /opt/buildhome/.cache):
  // after a Puppeteer version bump, the cache can still hold an older Chrome
  // build while the installed Puppeteer version expects a newer one, and
  // launch then fails with "Could not find Chrome (ver. ...)".
  console.log('🌐 Ensuring Puppeteer Chrome build is installed...');
  execSync('npx puppeteer browsers install chrome', {
    stdio: 'inherit',
    cwd: projectRoot
  });

  // Generate PDF using resumed CLI
  // Note: resumed creates the file in the current directory with the name "resume.pdf"
  console.log('🔨 Running resumed export...');

  execSync(
    `npx resumed export "${resumeJsonPath}" --format pdf --theme jsonresume-theme-stackoverflow --puppeteer-arg=--no-sandbox --puppeteer-arg=--disable-setuid-sandbox`,
    {
      stdio: 'inherit',
      cwd: projectRoot
    }
  );

  // Move the generated PDF to the public directory
  const generatedPdfPath = join(projectRoot, 'resume.pdf');

  if (existsSync(generatedPdfPath)) {
    console.log('📦 Moving PDF to public directory...');

    // Remove old PDF if it exists
    if (existsSync(outputPdfPath)) {
      unlinkSync(outputPdfPath);
    }

    // Move the file
    renameSync(generatedPdfPath, outputPdfPath);

    console.log('✅ Resume PDF generated successfully!');
    console.log(`📍 Location: ${outputPdfPath}`);
    console.log('🌐 Will be available at: /resume.pdf');
  } else {
    throw new Error('PDF was not generated at expected location');
  }

} catch (error) {
  console.error('❌ Error generating resume PDF:', error.message);
  process.exit(1);
}
