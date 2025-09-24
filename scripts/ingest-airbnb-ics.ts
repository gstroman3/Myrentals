// scripts/ingest-airbnb-ics.ts
import fs from 'node:fs';
import path from 'node:path';
import { ingestAirbnbCalendar } from '../lib/airbnbCalendar';
import { logger } from '../lib/logging';

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) return null;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const pair = parseEnvLine(line);
    if (!pair) continue;
    const [key, value] = pair;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function hydrateEnv() {
  const root = process.cwd();
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, '.env.local'));
}

function requireEnv(keys: string[]) {
  const missing = keys.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    const msg =
      `Missing required env var(s): ${missing.join(', ')}.\n` +
      `Set them in .env.local or your shell, e.g.:
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
AIRBNB_ICS_URL=https://.../calendar.ics`;
    throw new Error(msg);
  }
}

async function main() {
  hydrateEnv();

  try {
    requireEnv([
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'AIRBNB_ICS_URL',
    ]);

    const result = await ingestAirbnbCalendar();
    logger.info('Airbnb iCal ingest complete', result);
    console.log(
      `✅ Ingest complete | inserted=${result.inserted} updated=${result.updated} skipped=${result.skipped}`
    );
    process.exit(0);
  } catch (error) {
    logger.error('Failed to ingest Airbnb calendar', error);
    console.error('❌ Failed to ingest Airbnb calendar:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void main();
