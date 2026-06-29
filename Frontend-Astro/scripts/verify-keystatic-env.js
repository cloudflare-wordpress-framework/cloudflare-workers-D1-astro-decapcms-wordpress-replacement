import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(rootDir, '.env') });

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[ERROR] Missing ${name} in .env`);
    process.exitCode = 1;
  }
  return value || '';
}

const siteUrl = trimTrailingSlash(required('PUBLIC_SITE_URL'));
const callbackUrl = required('KEYSTATIC_GITHUB_CALLBACK_URL');
const expectedCallbackUrl = `${siteUrl}/api/keystatic/github/oauth/callback`;
const clientId = required('KEYSTATIC_GITHUB_CLIENT_ID');
const clientSecret = required('KEYSTATIC_GITHUB_CLIENT_SECRET');
const secret = required('KEYSTATIC_SECRET');

if (callbackUrl !== expectedCallbackUrl) {
  console.error('[ERROR] KEYSTATIC_GITHUB_CALLBACK_URL must match PUBLIC_SITE_URL.');
  console.error(`[ERROR] Expected: ${expectedCallbackUrl}`);
  console.error(`[ERROR] Actual:   ${callbackUrl}`);
  process.exitCode = 1;
}

if (secret && secret.length < 32) {
  console.error('[ERROR] KEYSTATIC_SECRET must be at least 32 characters long.');
  process.exitCode = 1;
}

if (clientSecret && clientSecret.length < 20) {
  console.warn('[WARNING] KEYSTATIC_GITHUB_CLIENT_SECRET looks unusually short. Make sure it is the secret for this exact OAuth App.');
}

if (!process.exitCode) {
  console.log('[SUCCESS] Keystatic .env configuration looks consistent.');
}

console.log(`[INFO] GitHub OAuth Client ID: ${clientId || '(missing)'}`);
console.log(`[INFO] GitHub OAuth Authorization callback URL: ${expectedCallbackUrl}`);
console.log('[INFO] This callback URL still has to be saved in the GitHub OAuth App settings.');
