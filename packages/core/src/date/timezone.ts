/**
 * Time zones without a library.
 *
 * A `Date` is an instant. Everything that draws a calendar — which hour a row
 * is, which day a column is — asks that instant for its *wall clock*, and a
 * `Date` only ever answers in the zone the browser happens to be in. Showing a
 * schedule in São Paulo to someone sitting in Lisbon means changing the answer,
 * not the instant.
 *
 * The trick these functions use is the one every date library ends up with:
 * shift the instant so that its **local** wall clock reads as the wall clock of
 * the zone you want. Everything downstream — `getHours`, `getDate`, the grid,
 * the keyboard — then works unchanged, and `fromZone` puts the instant back
 * when the reader has finished moving it.
 *
 * A shifted `Date` is not the instant any more. Keep it inside the drawing and
 * convert back before it leaves.
 */

const MINUTE = 60_000;

/**
 * Reused: building a DateTimeFormat is the expensive part, and a schedule asks
 * constantly. A zone the runtime does not know is remembered as `null`, so the
 * name is only ever tried once and never throws from inside a render.
 */
const formatters = new Map<string, Intl.DateTimeFormat | null>();

function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
    if (formatters.has(timeZone)) return formatters.get(timeZone)!;
    let formatter: Intl.DateTimeFormat | null = null;
    try {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        // Asking once: some runtimes only reject the name on first use.
        formatter.format(0);
    } catch {
        formatter = null;
    }
    formatters.set(timeZone, formatter);
    return formatter;
}

/** Whether the runtime knows the zone, for validating a name before it is stored. */
export const isValidTimeZone = (timeZone: string): boolean => formatterFor(timeZone) !== null;

/** The zone the browser is in, for a default that is not a guess. */
export const localTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * How far `timeZone` is ahead of UTC at `instant`, in minutes. It is asked per
 * instant rather than per zone because the answer changes twice a year.
 */
export function zoneOffset(instant: Date, timeZone: string): number {
    const formatter = formatterFor(timeZone);
    // A name nobody knows is not worth a thrown render: it reads as the
    // browser's own zone, which is what the calendar would have drawn anyway.
    if (!formatter) return -instant.getTimezoneOffset();
    const parts = formatter.formatToParts(instant);
    const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const asUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour'), read('minute'), read('second'));
    // Milliseconds are not in the parts, so they would otherwise round the offset off by a second.
    return Math.round((asUtc - (instant.getTime() - instant.getMilliseconds())) / MINUTE);
}

/**
 * The instant, shifted so its local wall clock reads as `timeZone`'s. What
 * comes back is for drawing and comparing within one zone — it is no longer
 * the instant it started as.
 */
export function toZone(instant: Date, timeZone: string | undefined): Date {
    if (!timeZone) return instant;
    return new Date(instant.getTime() + (zoneOffset(instant, timeZone) + instant.getTimezoneOffset()) * MINUTE);
}

/**
 * The inverse: takes a wall clock read in `timeZone` (as a shifted `Date`) and
 * gives back the instant it names.
 *
 * Twice a year a wall clock does not name one instant. On the morning the
 * clocks go forward an hour never happens, and on the morning they go back an
 * hour happens twice — which is exactly where a scheduler is least forgiving.
 * A single pass lands an hour out on both. So both plausible instants are
 * worked out and the answer is chosen the way every date library chooses it:
 * for an hour that happened twice, the **first** of them; for an hour that
 * never happened, the moment the clocks jumped to.
 */
export function fromZone(shifted: Date, timeZone: string | undefined): Date {
    if (!timeZone) return shifted;
    // The wall clock, read as though it were UTC.
    const wallAsUtc = shifted.getTime() - shifted.getTimezoneOffset() * MINUTE;
    // The offsets either side of any change that might fall on this day.
    const before = zoneOffset(new Date(wallAsUtc - 12 * 60 * MINUTE), timeZone);
    const after = zoneOffset(new Date(wallAsUtc + 12 * 60 * MINUTE), timeZone);
    const candidates = before === after ? [wallAsUtc - before * MINUTE] : [wallAsUtc - before * MINUTE, wallAsUtc - after * MINUTE];
    // A candidate is real when reading it back in the zone gives the wall clock
    // that was asked for; in the hour that is skipped, none of them does.
    const real = candidates.filter((t) => t + zoneOffset(new Date(t), timeZone) * MINUTE === wallAsUtc);
    if (real.length) return new Date(Math.min(...real));
    return new Date(Math.max(...candidates));
}

/**
 * What to call the zone in a heading: `'GMT-3'`, or the short name the locale
 * uses when it has one (`'BRT'`, `'CET'`).
 */
export function zoneLabel(timeZone: string, at: Date = new Date(), locale?: string, style: 'short' | 'shortOffset' = 'short'): string {
    try {
        const parts = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: style }).formatToParts(at);
        return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
    } catch {
        return timeZone;
    }
}
