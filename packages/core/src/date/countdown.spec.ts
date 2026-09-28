import { describe, expect, it } from 'vitest';
import { countdownParts } from './countdown';

describe('a countdown', () => {
    it('splits what is left into the units asked for', () => {
        const ms = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000 + 999;
        expect(countdownParts(ms)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, done: false });
        expect(countdownParts(ms, ['hours', 'minutes'])).toMatchObject({ days: 0, hours: 51, minutes: 4, seconds: 0 });
        expect(countdownParts(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
    });
});
