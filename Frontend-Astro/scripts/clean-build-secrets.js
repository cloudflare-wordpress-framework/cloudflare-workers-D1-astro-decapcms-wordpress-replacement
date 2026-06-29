import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

for (const relativePath of [
  'dist/server/.dev.vars',
  'dist/server/.prerender/.dev.vars',
]) {
  const filePath = path.join(frontendDir, relativePath);
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
    console.log(`[SUCCESS] Removed ${relativePath} from build output.`);
  }
}
