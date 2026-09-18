import { describe, expect, it } from 'vitest';
import { colorAreaAt, colorAreaKeyValue, formatColor, hexToHsb, hexToRgb, hsbToHex, hsbToRgb, parseColor, rgbToHex, rgbToHsb } from './color';

describe('colour conversion', () => {
    it('goes between HSB, RGB and hex', () => {
        expect(hsbToRgb({ h: 0, s: 100, b: 100 })).toEqual({ r: 255, g: 0, b: 0 });
        expect(hsbToRgb({ h: 120, s: 100, b: 50 })).toEqual({ r: 0, g: 128, b: 0 });
        expect(hsbToRgb({ h: 240, s: 0, b: 100 })).toEqual({ r: 255, g: 255, b: 255 });
        expect(hsbToRgb({ h: 360, s: 100, b: 100 })).toEqual({ r: 255, g: 0, b: 0 });
        expect(rgbToHsb({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, b: 100 });
        expect(rgbToHsb({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, b: 50 });
        expect(rgbToHex({ r: 255, g: 16, b: 0 })).toBe('ff1000');
        expect(hsbToHex({ h: 210, s: 100, b: 83 })).toBe('006ad4');
    });

    it('reads short and long hex, with or without #, and refuses anything else', () => {
        expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('336699')).toEqual({ r: 51, g: 102, b: 153 });
        expect(hexToRgb('#12345')).toBeNull();
        expect(hexToRgb('zzzzzz')).toBeNull();
        expect(hexToHsb('ff0000')).toEqual({ h: 0, s: 100, b: 100 });
        expect(hexToHsb('nope')).toBeNull();
        const exact = hexToHsb('336699', false)!;
        expect(exact.s).toBeCloseTo(66.667, 2);
        expect(hsbToHex(exact)).toBe('336699');
    });

    it('parses any bound value and formats back in the chosen format', () => {
        expect(parseColor('#ff0000')).toEqual({ h: 0, s: 100, b: 100 });
        expect(parseColor({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, b: 100 });
        expect(parseColor({ h: 400, s: -5, b: 50 })).toEqual({ h: 360, s: 0, b: 50 });
        expect(parseColor(null)).toBeNull();
        expect(parseColor(42)).toBeNull();
        const hsb = { h: 0, s: 100, b: 100 };
        expect(formatColor(hsb)).toBe('ff0000');
        expect(formatColor(hsb, 'rgb')).toEqual({ r: 255, g: 0, b: 0 });
        expect(formatColor({ h: 10.4, s: 20.6, b: 30 }, 'hsb')).toEqual({ h: 10, s: 21, b: 30 });
    });
});

describe('colour area', () => {
    const hsb = { h: 200, s: 50, b: 50 };

    it('moves saturation sideways and brightness up and down, in tens with Shift or the page keys', () => {
        expect(colorAreaKeyValue('ArrowRight', hsb)).toEqual({ h: 200, s: 51, b: 50 });
        expect(colorAreaKeyValue('ArrowLeft', hsb, true)).toEqual({ h: 200, s: 40, b: 50 });
        expect(colorAreaKeyValue('ArrowUp', hsb)).toEqual({ h: 200, s: 50, b: 51 });
        expect(colorAreaKeyValue('ArrowDown', hsb)).toEqual({ h: 200, s: 50, b: 49 });
        expect(colorAreaKeyValue('PageUp', { ...hsb, b: 95 })).toEqual({ h: 200, s: 50, b: 100 });
        expect(colorAreaKeyValue('PageDown', hsb)).toEqual({ h: 200, s: 50, b: 40 });
        expect(colorAreaKeyValue('Home', hsb)?.s).toBe(0);
        expect(colorAreaKeyValue('End', hsb)?.s).toBe(100);
        expect(colorAreaKeyValue('a', hsb)).toBeNull();
    });

    it('reads a point of the area as saturation and brightness', () => {
        expect(colorAreaAt(0, 0, 30)).toEqual({ h: 30, s: 0, b: 100 });
        expect(colorAreaAt(1, 1, 30)).toEqual({ h: 30, s: 100, b: 0 });
        expect(colorAreaAt(0.5, 2, 30)).toEqual({ h: 30, s: 50, b: 0 });
    });
});
