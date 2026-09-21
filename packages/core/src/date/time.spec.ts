import { describe, expect, it } from 'vitest';
import { atMinutesOfDay, clampMinutes, formatMinutes, minutesOf, nearestOption, parseMinutes, timeKeyTarget, timeOptions } from './time';

describe('times of day as minutes', () => {
    it('reads a clock off a date and sets one back on it', () => {
        expect(minutesOf(new Date(2026, 0, 2, 9, 30))).toBe(570);
        expect(minutesOf(new Date(2026, 0, 2, 0, 0))).toBe(0);
        const day = new Date(2026, 0, 2, 3, 15, 42, 500);
        const at = atMinutesOfDay(day, 570);
        expect([at.getHours(), at.getMinutes(), at.getSeconds(), at.getMilliseconds()]).toEqual([9, 30, 0, 0]);
        // The day itself is untouched, which is what makes it safe to bind to a date.
        expect(at.getDate()).toBe(2);
        expect(day.getHours()).toBe(3);
    });

    it('keeps a time inside the day and inside its bounds', () => {
        expect(clampMinutes(-10)).toBe(0);
        expect(clampMinutes(5000)).toBe(1439);
        expect(clampMinutes(600, 540, 1020)).toBe(600);
        expect(clampMinutes(60, 540, 1020)).toBe(540);
        expect(clampMinutes(1400, 540, 1020)).toBe(1020);
    });

    it('writes the time the way the locale writes it', () => {
        expect(formatMinutes(570, { locale: 'en-GB', hour12: false })).toBe('09:30');
        expect(formatMinutes(1290, { locale: 'en-US', hour12: true })).toMatch(/9:30\s?PM/i);
        expect(formatMinutes(0, { locale: 'en-GB', hour12: false })).toBe('00:00');
        expect(formatMinutes(570, { locale: 'en-GB', hour12: false, seconds: true })).toBe('09:30:00');
    });

    it('is forgiving about what someone types, because a time box is typed into', () => {
        for (const [text, minutes] of [
            ['9', 540],
            ['09', 540],
            ['930', 570],
            ['9:30', 570],
            ['9.30', 570],
            ['9h30', 570],
            ['21:30', 1290],
            ['9 pm', 1260],
            ['9:30PM', 1290],
            ['12 am', 0],
            ['12 pm', 720]
        ] as [string, number][]) {
            expect(parseMinutes(text), text).toBe(minutes);
        }
    });

    it('refuses what names no time at all', () => {
        expect(parseMinutes('')).toBeNull();
        expect(parseMinutes('later')).toBeNull();
        expect(parseMinutes('9:75')).toBeNull();
        expect(parseMinutes('25:00')).toBeNull();
        // Thirteen in the afternoon is not a thing a clock says.
        expect(parseMinutes('13 pm')).toBeNull();
    });

    it('builds the list from the same numbers everything else uses', () => {
        const every30 = timeOptions({ step: 30, locale: 'en-GB', hour12: false });
        expect(every30).toHaveLength(48);
        expect(every30[0]).toEqual({ minutes: 0, label: '00:00' });
        expect(every30[19]).toEqual({ minutes: 570, label: '09:30' });

        // Bounded, it starts and ends where it was told.
        const office = timeOptions({ step: 60, min: 540, max: 1020, locale: 'en-GB', hour12: false });
        expect(office.map((o) => o.label)).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);
    });

    it('marks the option a value falls in, not only the one it matches', () => {
        const options = timeOptions({ step: 30, locale: 'en-GB', hour12: false });
        expect(nearestOption(options, 570)).toBe(19);
        // 09:45 is not on the list; it belongs under 09:30.
        expect(options[nearestOption(options, 585)]!.label).toBe('09:30');
        expect(nearestOption(options, null)).toBe(-1);
    });

    it('moves by a step from the keyboard, and by an hour on Page Up', () => {
        expect(timeKeyTarget(570, 'ArrowUp', 15)).toBe(585);
        expect(timeKeyTarget(570, 'ArrowDown', 15)).toBe(555);
        expect(timeKeyTarget(570, 'PageUp', 15)).toBe(630);
        expect(timeKeyTarget(570, 'PageDown', 15)).toBe(510);
        expect(timeKeyTarget(570, 'Home', 15, { min: 540 })).toBe(540);
        expect(timeKeyTarget(570, 'End', 15, { max: 1020 })).toBe(1020);
        // It stops at the bounds rather than wrapping round the clock.
        expect(timeKeyTarget(540, 'ArrowDown', 15, { min: 540 })).toBe(540);
        expect(timeKeyTarget(0, 'ArrowDown', 15)).toBe(0);
        expect(timeKeyTarget(570, 'Enter', 15)).toBeNull();
    });
});
