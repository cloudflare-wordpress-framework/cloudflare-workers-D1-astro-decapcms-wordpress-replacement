import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const frontendDir = path.resolve(rootDir, 'Frontend-Astro');
const backendDir = path.resolve(rootDir, 'Backend-worker');

// Load environment variables from .env
dotenv.config({ path: path.join(rootDir, '.env') });

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function getKeystaticCallbackUrl() {
  const siteUrl = process.env.PUBLIC_SITE_URL ? trimTrailingSlash(process.env.PUBLIC_SITE_URL) : '';
  return process.env.KEYSTATIC_GITHUB_CALLBACK_URL || `${siteUrl}/api/keystatic/github/oauth/callback`;
}

function validateKeystaticCallbackUrl() {
  const siteUrl = process.env.PUBLIC_SITE_URL ? trimTrailingSlash(process.env.PUBLIC_SITE_URL) : '';
  if (!siteUrl) {
    console.warn('[WARNING] PUBLIC_SITE_URL is missing in .env; Keystatic production callback cannot be validated.');
    return;
  }

  const expected = `${siteUrl}/api/keystatic/github/oauth/callback`;
  const actual = getKeystaticCallbackUrl();

  if (actual !== expected) {
    console.error(`[ERROR] KEYSTATIC_GITHUB_CALLBACK_URL must match PUBLIC_SITE_URL.`);
    console.error(`[ERROR] Expected: ${expected}`);
    console.error(`[ERROR] Actual:   ${actual}`);
    process.exit(1);
  }
}

validateKeystaticCallbackUrl();

function replaceEnvVariables(templatePath, outputPath) {
  try {
    let content = fs.readFileSync(templatePath, 'utf8');
    // Regex to match ${VAR_NAME}
    content = content.replace(/\$\{([A-Z0-9_]+)\}/g, (match, varName) => {
      const value = process.env[varName];
      if (value === undefined) {
        console.warn(`[WARNING] Variable ${varName} is missing in .env file!`);
        return match;
      }
      return value;
    });
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`[SUCCESS] Generated ${path.relative(rootDir, outputPath)} from template.`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`[ERROR] Template file ${templatePath} not found.`);
    } else {
      console.error(`[ERROR] Processing ${templatePath}:`, error);
    }
  }
}

// 1. Generate wrangler.toml
replaceEnvVariables(
  path.join(backendDir, 'wrangler.template.toml'),
  path.join(backendDir, 'wrangler.toml')
);

// 2. Generate .dev.vars for local Worker execution
const devVarsContent = `
GITHUB_CLIENT_ID="${process.env.GITHUB_CLIENT_ID || ''}"
GITHUB_CLIENT_SECRET="${process.env.GITHUB_CLIENT_SECRET || ''}"
GITHUB_PAT="${process.env.GITHUB_PAT || ''}"
`.trim();

fs.writeFileSync(path.join(backendDir, '.dev.vars'), devVarsContent, 'utf8');
console.log(`[SUCCESS] Generated .dev.vars for Wrangler local development.`);

const frontendDevVarsContent = `
KEYSTATIC_GITHUB_CLIENT_ID="${process.env.KEYSTATIC_GITHUB_CLIENT_ID || ''}"
KEYSTATIC_GITHUB_CLIENT_SECRET="${process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || ''}"
KEYSTATIC_SECRET="${process.env.KEYSTATIC_SECRET || ''}"
PUBLIC_SITE_URL="${process.env.PUBLIC_SITE_URL || ''}"
KEYSTATIC_GITHUB_CALLBACK_URL="${getKeystaticCallbackUrl()}"
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG="${process.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG || ''}"
`.trim();

fs.writeFileSync(path.join(frontendDir, '.dev.vars'), frontendDevVarsContent, 'utf8');
console.log(`[SUCCESS] Generated Frontend-Astro/.dev.vars for Keystatic local Worker development.`);
console.log(`[INFO] Keystatic GitHub callback URL: ${getKeystaticCallbackUrl()}`);
