import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const backendDir = path.resolve(rootDir, 'Backend-worker');

// Load environment variables from .env
dotenv.config({ path: path.join(rootDir, '.env') });

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
