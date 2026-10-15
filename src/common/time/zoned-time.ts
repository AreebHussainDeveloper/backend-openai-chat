/**
 * Calendar maths in a named IANA time zone (the shop's), without a date library.
 * Dates are 'YYYY-MM-DD' strings; instants are JS Dates.
 */

const DAY_MS = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(
  timeZone: string | null | undefined,
): timeZone is string {
  if (!timeZone) return false;
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock parts of `instant` in `timeZone`. */
function wallClock(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(instant)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;
  return parts;
}

/** Offset of `timeZone` from UTC at `instant`, in ms (e.g. +18,000,000 for Asia/Karachi). */
function offsetMs(instant: Date, timeZone: string): number {
  const w = wallClock(instant, timeZone);
  const asUtc = Date.UTC(
    w.year,
    w.month - 1,
    w.day,
    w.hour,
    w.minute,
    w.second,
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The calendar date of `instant` in `timeZone`, as 'YYYY-MM-DD'. */
export function localDate(instant: Date, timeZone: string): string {
  const w = wallClock(instant, timeZone);
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

/** Milliseconds since local midnight of `instant` in `timeZone`. */
export function localTimeOfDayMs(instant: Date, timeZone: string): number {
  const w = wallClock(instant, timeZone);
  return (
    ((w.hour * 60 + w.minute) * 60 + w.second) * 1000 +
    instant.getUTCMilliseconds()
  );
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Every date from `from` to `to`, inclusive. */
export function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The instant at which the wall clock in `timeZone` shows `date` + `timeOfDayMs`. */
export function zonedTimeToInstant(
  date: string,
  timeOfDayMs: number,
  timeZone: string,
): Date {
  const [y, m, d] = date.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d) + timeOfDayMs;
  // Two passes settle DST transitions (the offset at the guess may differ from the offset at `wall`).
  let guess = wall - offsetMs(new Date(wall), timeZone);
  guess = wall - offsetMs(new Date(guess), timeZone);
  return new Date(guess);
}

/** Start of `date` (local midnight) in `timeZone`. */
export function startOfLocalDay(date: string, timeZone: string): Date {
  return zonedTimeToInstant(date, 0, timeZone);
}

/** ISO timestamp without milliseconds, the form Shopify's search syntax documents. */
export function searchTimestamp(instant: Date): string {
  return instant.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
