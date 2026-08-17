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

  console.warn('💡 Tip: Make sure your resume.json is valid JSON Resume format');
  process.exit(1);
}
