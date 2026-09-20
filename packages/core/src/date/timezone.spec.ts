import { describe, expect, it } from 'vitest';
import { fromZone, isValidTimeZone, localTimeZone, toZone, zoneLabel, zoneOffset } from './timezone';

// A shifted date's local wall clock is the zone's, whatever zone the runner sits in,
// so nothing here may be built from UTC components.
const wall = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

describe('time zones without a library', () => {
    it('reads how far a zone is from UTC at an instant', () => {
        const midwinter = new Date('2026-01-15T12:00:00Z');
        expect(zoneOffset(midwinter, 'UTC')).toBe(0);
        expect(zoneOffset(midwinter, 'America/Sao_Paulo')).toBe(-180);
        expect(zoneOffset(midwinter, 'Asia/Tokyo')).toBe(540);
        // Half-hour and quarter-hour zones are not a rounding error.
        expect(zoneOffset(midwinter, 'Asia/Kolkata')).toBe(330);
        expect(zoneOffset(midwinter, 'Asia/Kathmandu')).toBe(345);
    });

    it('asks per instant, because the answer changes twice a year', () => {
        expect(zoneOffset(new Date('2026-01-15T12:00:00Z'), 'Europe/Lisbon')).toBe(0);
        expect(zoneOffset(new Date('2026-07-15T12:00:00Z'), 'Europe/Lisbon')).toBe(60);
    });

    it('shifts an instant so its local wall clock reads as the zone', () => {
        const instant = new Date('2026-03-10T14:30:00Z');
        expect(wall(toZone(instant, 'America/Sao_Paulo'))).toBe('2026-03-10 11:30');
        expect(wall(toZone(instant, 'Asia/Tokyo'))).toBe('2026-03-10 23:30');
        // A zone that pushes past midnight moves the day, which is the point:
        // the calendar draws it in a different column.
        expect(wall(toZone(new Date('2026-03-10T22:00:00Z'), 'Asia/Tokyo'))).toBe('2026-03-11 07:00');
        expect(toZone(instant, undefined)).toBe(instant);
    });

    it('puts a wall clock back to the instant it names', () => {
        for (const zone of ['America/Sao_Paulo', 'Asia/Tokyo', 'Europe/Lisbon', 'Asia/Kathmandu', 'UTC']) {
            for (const iso of ['2026-01-15T12:00:00Z', '2026-07-15T12:00:00Z', '2026-03-29T00:30:00Z']) {
                const instant = new Date(iso);
                expect(fromZone(toZone(instant, zone), zone).toISOString(), `${zone} ${iso}`).toBe(instant.toISOString());
            }
        }
    });

    it('survives the hour that daylight saving takes away, and the one it gives back', () => {
        // Europe/Lisbon springs forward at 01:00 on 29 March 2026: 01:00 does
        // not exist. A single-pass conversion lands an hour out here.
        const spring = new Date('2026-03-29T00:30:00Z');
        expect(zoneOffset(spring, 'Europe/Lisbon')).toBe(0);
        expect(fromZone(toZone(spring, 'Europe/Lisbon'), 'Europe/Lisbon').toISOString()).toBe(spring.toISOString());

        // And back again on 25 October, when 01:00 happens twice.
        const autumn = new Date('2026-10-25T00:30:00Z');
        expect(fromZone(toZone(autumn, 'Europe/Lisbon'), 'Europe/Lisbon').toISOString()).toBe(autumn.toISOString());
    });

    it('chooses for the hour that happened twice and the one that never did', () => {
        // Lisbon goes back at 02:00 on 25 October 2026, so 01:30 happens twice:
        // once at 00:30 UTC still on summer time, once at 01:30 UTC off it. A
        // wall clock cannot say which, and the first is the one to take.
        const twice = new Date(2026, 9, 25, 1, 30);
        expect(fromZone(twice, 'Europe/Lisbon').toISOString()).toBe('2026-10-25T00:30:00.000Z');

        // It goes forward at 01:00 on 29 March, so 01:30 never happens at all.
        // The answer is the moment the clocks jumped to, not an hour before it.
        const never = new Date(2026, 2, 29, 1, 30);
        expect(fromZone(never, 'Europe/Lisbon').toISOString()).toBe('2026-03-29T01:30:00.000Z');
        expect(zoneOffset(fromZone(never, 'Europe/Lisbon'), 'Europe/Lisbon')).toBe(60);
    });

    it('says whether it knows a zone rather than throwing mid-render', () => {
        expect(isValidTimeZone('America/Sao_Paulo')).toBe(true);
        expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
        expect(isValidTimeZone('')).toBe(false);
    });

    it('names a zone for a heading, and falls back to the zone itself', () => {
        expect(zoneLabel('America/Sao_Paulo', new Date('2026-01-15T12:00:00Z'), 'en-US', 'shortOffset')).toBe('GMT-3');
        expect(zoneLabel('Mars/Olympus_Mons')).toBe('Mars/Olympus_Mons');
        expect(localTimeZone()).toBeTruthy();
    });
});
