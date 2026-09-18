import { describe, expect, it } from 'vitest';
import { liveRegion, severityIcon, toPercent } from './feedback';

describe('liveRegion', () => {
    it('is a polite status unless the severity is urgent', () => {
        expect(liveRegion('info')).toEqual({ role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
        expect(liveRegion(undefined).role).toBe('status');
        expect(liveRegion('danger')).toEqual({ role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' });
    });

    it('takes the list of urgent severities', () => {
        expect(liveRegion('warn').role).toBe('status');
        expect(liveRegion('warn', ['danger', 'warn']).role).toBe('alert');
    });
});

describe('severityIcon', () => {
    it('maps each severity to a built-in icon', () => {
        expect(severityIcon('success')).toBe('success');
        expect(severityIcon('warn')).toBe('warning');
        expect(severityIcon('danger')).toBe('error');
        expect(severityIcon('info')).toBe('info');
        expect(severityIcon('secondary')).toBe('info');
    });
});

describe('toPercent', () => {
    it('clamps and scales', () => {
        expect(toPercent(50)).toBe(50);
        expect(toPercent(-5)).toBe(0);
        expect(toPercent(140)).toBe(100);
        expect(toPercent(3, 0, 4)).toBe(75);
        expect(toPercent(Number.NaN)).toBe(0);
        expect(toPercent(1, 5, 5)).toBe(0);
    });
});
