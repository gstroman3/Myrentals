type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (!raw) return 'info';
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
}

const ACTIVE_LEVEL = resolveLevel();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[ACTIVE_LEVEL];
}

function formatMessage(message: string, meta?: unknown): unknown[] {
  if (meta === undefined) return [message];
  return [message, meta];
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (!shouldLog('debug')) return;
    console.debug(...formatMessage(message, meta));
  },
  info(message: string, meta?: unknown) {
    if (!shouldLog('info')) return;
    console.info(...formatMessage(message, meta));
  },
  warn(message: string, meta?: unknown) {
    if (!shouldLog('warn')) return;
    console.warn(...formatMessage(message, meta));
  },
  error(message: string, meta?: unknown) {
    if (!shouldLog('error')) return;
    console.error(...formatMessage(message, meta));
  },
};

