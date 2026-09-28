export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';

/**
 * What is left until a moment, in the units asked for: the largest unit takes
 * everything above the next (with `hours` and no `days`, 50 hours stays 50),
 * and the smallest drops what is below it. Never negative.
 */
export function countdownParts(ms: number, units: readonly CountdownUnit[] = ['days', 'hours', 'minutes', 'seconds']): Record<CountdownUnit, number> & { done: boolean } {
    let left = Math.max(0, Math.floor(ms / 1000));
    const size: Record<CountdownUnit, number> = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };
    const out = { days: 0, hours: 0, minutes: 0, seconds: 0, done: ms <= 0 };
    for (const unit of ['days', 'hours', 'minutes', 'seconds'] as const) {
        if (!units.includes(unit)) continue;
        out[unit] = Math.floor(left / size[unit]);
        left -= out[unit] * size[unit];
    }
    return out;
}
