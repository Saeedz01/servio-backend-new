// Loads the project's .env file into process.env before anything else
// reads it (PORT, DATABASE_URL, Observe keys). Imported first in
// main.ts so it runs before the other modules are evaluated.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}
