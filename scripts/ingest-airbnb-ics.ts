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
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

async function main() {
  hydrateEnv();
  try {
    const result = await ingestAirbnbCalendar();
    logger.info('Airbnb iCal ingest complete', result);
    console.log(
      `Ingest complete. Inserted: ${result.inserted}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
    );
    process.exit(0);
  } catch (error) {
    logger.error('Failed to ingest Airbnb calendar', error);
    console.error('Failed to ingest Airbnb calendar:', error);
    process.exit(1);
  }
}

void main();

