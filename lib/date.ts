export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function format(date: Date, fmt: string): string {
  if (fmt === 'yyyy-MM-dd') {
    return date.toISOString().slice(0, 10);
  }
  throw new Error(`Unsupported format: ${fmt}`);
}

export function formatInTimeZone(date: Date, timeZone: string, fmt: string): string {
  if (fmt === 'yyyy-MM-dd') {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
  }
  throw new Error(`Unsupported format: ${fmt}`);
}

export function utcToZonedTime(date: Date, timeZone: string): Date {
  const inv = new Date(date.toLocaleString('en-US', { timeZone }));
  const diff = date.getTime() - inv.getTime();
  return new Date(date.getTime() - diff);
}

export function zonedTimeToUtc(date: Date, timeZone: string): Date {
  const inv = new Date(date.toLocaleString('en-US', { timeZone }));
  const diff = inv.getTime() - date.getTime();
  return new Date(date.getTime() - diff);
}

export function parse(value: string, fmt: string, _ref: Date): Date {
  if (fmt === 'yyyyMMdd') {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return new Date(year, month, day);
  }
  if (fmt === "yyyyMMdd'T'HHmmssX") {
    return new Date(value);
  }
  throw new Error(`Unsupported parse format: ${fmt}`);
}
