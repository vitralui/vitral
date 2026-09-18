import { describe, expect, it } from 'vitest';
import { arcPath, knobAngle, knobValueAt, polarPoint, ratingKeyValue } from './dial';

const scale = { min: 0, max: 100, step: 1 };

describe('knob geometry', () => {
    it('maps the value range onto a 270° sweep centred on the top', () => {
        expect(knobAngle(0, 0, 100)).toBe(-135);
        expect(knobAngle(50, 0, 100)).toBe(0);
        expect(knobAngle(100, 0, 100)).toBe(135);
        expect(polarPoint(50, 50, 40, 90)).toEqual({ x: 90, y: 50 });
        expect(polarPoint(50, 50, 40, 0)).toEqual({ x: 50, y: 10 });
    });

    it('draws a clockwise arc, with the large-arc flag past 180°', () => {
        expect(arcPath(50, 50, 40, 0, 90)).toBe('M 50 10 A 40 40 0 0 1 90 50');
        expect(arcPath(50, 50, 40, -135, 135)).toContain(' 0 1 1 ');
        expect(arcPath(50, 50, 40, 10, 10)).toBe('');
    });

    it('reads the value under the pointer, sending the bottom gap to the nearer end', () => {
        expect(knobValueAt(0, -10, scale)).toBe(50);
        expect(knobValueAt(10, 0, scale)).toBe(83);
        expect(knobValueAt(0.01, 10, scale)).toBe(100);
        expect(knobValueAt(-0.01, 10, scale)).toBe(0);
    });
});

describe('rating keys', () => {
    it('steps and wraps like a radio group, reaching zero only when it may be cleared', () => {
        expect(ratingKeyValue('ArrowRight', 2, 5)).toBe(3);
        expect(ratingKeyValue('ArrowRight', 5, 5)).toBe(1);
        expect(ratingKeyValue('ArrowRight', 5, 5, { allowZero: true })).toBe(0);
        expect(ratingKeyValue('ArrowLeft', 1, 5)).toBe(5);
        expect(ratingKeyValue('ArrowDown', 3, 5)).toBe(2);
        expect(ratingKeyValue('ArrowRight', 0, 5)).toBe(1);
        expect(ratingKeyValue('ArrowLeft', 3, 5, { rtl: true })).toBe(4);
        expect(ratingKeyValue('Home', 3, 5, { allowZero: true })).toBe(0);
        expect(ratingKeyValue('End', 3, 5)).toBe(5);
        expect(ratingKeyValue('x', 3, 5)).toBeNull();
    });

    it('steps by halves and quarters without landing between them', () => {
        expect(ratingKeyValue('ArrowRight', 2, 5, { step: 0.5 })).toBe(2.5);
        expect(ratingKeyValue('ArrowLeft', 2.5, 5, { step: 0.5 })).toBe(2);
        expect(ratingKeyValue('ArrowRight', 5, 5, { step: 0.5 })).toBe(0.5);
        expect(ratingKeyValue('ArrowLeft', 0.5, 5, { step: 0.5 })).toBe(5);
        expect(ratingKeyValue('Home', 3, 5, { step: 0.5 })).toBe(0.5);
        expect(ratingKeyValue('Home', 3, 5, { step: 0.5, allowZero: true })).toBe(0);

        // A tenth added ten times is not one, in binary. It has to be anyway.
        let value = 0.1;
        for (let i = 0; i < 9; i++) value = ratingKeyValue('ArrowRight', value, 5, { step: 0.1 })!;
        expect(value).toBe(1);
    });
});
