import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const frontendDir = path.resolve(rootDir, 'Frontend-Astro');

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
    console.error('[ERROR] Missing required PUBLIC_SITE_URL in .env.');
    process.exit(1);
  }

  const expected = `${siteUrl}/api/keystatic/github/oauth/callback`;
  const actual = getKeystaticCallbackUrl();

  if (actual !== expected) {
    console.error('[ERROR] KEYSTATIC_GITHUB_CALLBACK_URL does not match PUBLIC_SITE_URL.');
    console.error(`[ERROR] Expected: ${expected}`);
    console.error(`[ERROR] Actual:   ${actual}`);
    process.exit(1);
  }
}

const requiredSecrets = [
  'KEYSTATIC_GITHUB_CLIENT_ID',
  'KEYSTATIC_GITHUB_CLIENT_SECRET',
  'KEYSTATIC_SECRET',
];

const syncedValues = {
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
  KEYSTATIC_GITHUB_CALLBACK_URL: getKeystaticCallbackUrl(),
  PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: process.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG,
};

validateKeystaticCallbackUrl();

const missing = [...requiredSecrets, 'PUBLIC_SITE_URL'].filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`[ERROR] Missing required Keystatic env vars in .env: ${missing.join(', ')}`);
  process.exit(1);
}

for (const name of [...requiredSecrets, ...Object.keys(syncedValues)]) {
  const value = requiredSecrets.includes(name) ? process.env[name] : syncedValues[name];
  if (!value) continue;

  const result = spawnSync('npx', ['wrangler', 'secret', 'put', name], {
    cwd: frontendDir,
    input: `${value}\n`,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    console.error(`[ERROR] Failed to sync ${name} to Cloudflare.`);
    process.exit(result.status ?? 1);
  }
}

console.log('[SUCCESS] Synced Keystatic secrets to the frontend Cloudflare Worker.');
console.log(`[INFO] GitHub OAuth callback URL must be: ${getKeystaticCallbackUrl()}`);
