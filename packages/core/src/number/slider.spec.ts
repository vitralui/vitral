import { describe, expect, it } from 'vitest';
import { nearestThumb, normalizeRange, pointerRatio, ratioToValue, setRangeThumb, sliderKeyValue, snapToStep, thumbBounds, valueToRatio } from '../index';

const scale = { min: 0, max: 100, step: 1 };

describe('slider arithmetic', () => {
    it('snaps to the step grid from min, without floating-point noise', () => {
        expect(snapToStep(42.4, scale)).toBe(42);
        expect(snapToStep(42.5, scale)).toBe(43);
        expect(snapToStep(0.30000000000000004, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
        expect(snapToStep(0.7, { min: 0, max: 1, step: 0.1 })).toBe(0.7);
        expect(snapToStep(7, { min: 1, max: 20, step: 5 })).toBe(6);
        expect(snapToStep(1.3e-7, { min: 0, max: 1e-6, step: 1e-7 })).toBe(1e-7);
    });

    it('clamps to the scale and keeps an off-grid max on the grid', () => {
        expect(snapToStep(-5, scale)).toBe(0);
        expect(snapToStep(500, scale)).toBe(100);
        expect(snapToStep(10, { min: 0, max: 10, step: 3 })).toBe(9);
        expect(snapToStep(Number.NaN, scale)).toBe(0);
        expect(snapToStep(3.3333, { min: 0, max: 10, step: 0 })).toBe(3.3333);
    });

    it('converts between values and positions, with the minimum of a vertical track at the bottom', () => {
        expect(valueToRatio(25, 0, 200)).toBe(0.125);
        expect(valueToRatio(-1, 0, 10)).toBe(0);
        expect(valueToRatio(5, 5, 5)).toBe(0);
        expect(ratioToValue(0.5, -10, 10)).toBe(0);
        expect(ratioToValue(2, 0, 10)).toBe(10);
        expect(pointerRatio(50, 200)).toBe(0.25);
        expect(pointerRatio(50, 200, true)).toBe(0.75);
        expect(pointerRatio(-10, 200)).toBe(0);
        expect(pointerRatio(10, 0)).toBe(0);
    });

    it('answers the slider keys and ignores the rest', () => {
        expect(sliderKeyValue('ArrowRight', 10, scale)).toBe(11);
        expect(sliderKeyValue('ArrowUp', 10, scale)).toBe(11);
        expect(sliderKeyValue('ArrowLeft', 10, scale)).toBe(9);
        expect(sliderKeyValue('ArrowDown', 10, scale)).toBe(9);
        expect(sliderKeyValue('PageUp', 10, scale)).toBe(20);
        expect(sliderKeyValue('PageDown', 5, scale)).toBe(0);
        expect(sliderKeyValue('Home', 50, scale)).toBe(0);
        expect(sliderKeyValue('End', 50, scale)).toBe(100);
        expect(sliderKeyValue('ArrowRight', 100, scale)).toBe(100);
        expect(sliderKeyValue('End', 0, { min: 0, max: 10, step: 3 })).toBe(9);
        expect(sliderKeyValue('a', 50, scale)).toBeNull();
        expect(sliderKeyValue('ArrowUp', 0.2, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
    });

    it('stops a range thumb at the other one, from the keyboard as well', () => {
        const values: [number, number] = [20, 60];
        expect(thumbBounds(values, 0, scale)).toEqual([0, 60]);
        expect(thumbBounds(values, 1, scale)).toEqual([20, 100]);
        expect(sliderKeyValue('End', 20, scale, thumbBounds(values, 0, scale))).toBe(60);
        expect(sliderKeyValue('PageDown', 25, scale, thumbBounds([20, 25], 1, scale))).toBe(20);
        expect(setRangeThumb(values, 0, 80, scale)).toEqual([60, 60]);
        expect(setRangeThumb(values, 1, 10.4, scale)).toEqual([20, 20]);
        expect(setRangeThumb(values, 1, 70.6, scale)).toEqual([20, 71]);
    });

    it('orders and bounds a pair of values', () => {
        expect(normalizeRange([80, 20], scale)).toEqual([20, 80]);
        expect(normalizeRange([-5, 500], scale)).toEqual([0, 100]);
        expect(normalizeRange(null, scale)).toEqual([0, 100]);
    });

    it('moves the nearer thumb for a press on the track, and opens a collapsed range towards the press', () => {
        expect(nearestThumb([20, 60], 30)).toBe(0);
        expect(nearestThumb([20, 60], 50)).toBe(1);
        expect(nearestThumb([40, 40], 10)).toBe(0);
        expect(nearestThumb([40, 40], 70)).toBe(1);
    });
});
