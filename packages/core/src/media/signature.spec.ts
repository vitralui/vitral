import { describe, expect, it } from 'vitest';
import { addSignaturePoint, createSignaturePressure, signatureOutline, signatureStrokePath, signatureSVG, smoothSignatureStroke, type SignaturePoint } from './signature';

describe('a signature', () => {
    it('draws a dot, a line, and a curve through the midpoints', () => {
        expect(signatureStrokePath([[1, 1]])).toBe('M1,1l0.01,0');
        expect(signatureStrokePath([[0, 0], [10, 0]])).toBe('M0,0L10,0');
        expect(signatureStrokePath([[0, 0], [10, 0], [20, 10]])).toBe('M0,0Q10,0 15,5L20,10');
        expect(signatureStrokePath([])).toBe('');
    });

    it('drops points a still pointer adds', () => {
        const stroke: SignaturePoint[] = [];
        expect(addSignaturePoint(stroke, [0, 0])).toBe(true);
        expect(addSignaturePoint(stroke, [0.5, 0.5])).toBe(false);
        expect(addSignaturePoint(stroke, [3, 0])).toBe(true);
        expect(stroke).toHaveLength(2);
    });

    it('writes a standalone SVG', () => {
        const svg = signatureSVG([[[0, 0], [10, 0]]], { width: 100, height: 40, color: 'navy', background: 'white' });
        expect(svg).toContain('viewBox="0 0 100 40"');
        expect(svg).toContain('stroke="navy"');
        expect(svg).toContain('<rect width="100%" height="100%" fill="white"/>');
        expect(svg).toContain('<path d="M0,0L10,0"/>');
    });
});

describe('ink that thins', () => {
    const line: SignaturePoint[] = Array.from({ length: 20 }, (_, i) => [i * 5, 50 + Math.sin(i / 3) * 10, i < 10 ? 1 : 0]);
    const widthAt = (d: string, x: number) => {
        // The outline's two edges above and below a point: how far apart they are.
        const ys = [...d.replace(/A[\d.]+,[\d.]+ 0 [01],[01] /g, 'A').matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]).filter(([px]) => Math.abs(px! - x) < 2.5).map(([, py]) => py!);
        return Math.max(...ys) - Math.min(...ys);
    };

    it('is a filled outline, wider where pressed and narrower where it hurried', () => {
        const d = signatureOutline(line, { width: 4, thinning: 0.8 });
        expect(d.startsWith('M')).toBe(true);
        expect(d.endsWith('Z')).toBe(true);
        expect(d).toMatch(/A[\d.]+,[\d.]+ 0 0,0/);
        expect(widthAt(d, 25)).toBeGreaterThan(widthAt(d, 75) * 2);
    });

    it('narrows to a point over a taper, and draws a dot as a circle', () => {
        const flat: SignaturePoint[] = Array.from({ length: 30 }, (_, i) => [i * 4, 20]);
        const d = signatureOutline(flat, { width: 6, taper: 30 });
        expect(widthAt(d, 60)).toBeGreaterThan(5);
        expect(widthAt(d, 0)).toBeLessThan(2);
        expect(signatureOutline([[10, 10]], { width: 4 })).toBe('M8,10a2,2 0 1,0 4,0a2,2 0 1,0 -4,0Z');
    });

    it('smooths the tremor away but still reaches where the hand stopped', () => {
        const shaky: SignaturePoint[] = Array.from({ length: 12 }, (_, i) => [i * 10, i % 2 ? 6 : -6]);
        const smooth = smoothSignatureStroke(shaky, 0.8);
        const swing = (s: SignaturePoint[]) => Math.max(...s.slice(2, -2).map((p) => Math.abs(p[1])));
        expect(swing(smooth)).toBeLessThan(swing(shaky) * 0.6);
        expect(smooth.at(-1)).toEqual(shaky.at(-1));
        expect(smoothSignatureStroke(shaky, 0)).toEqual(shaky);
    });

    it('reads a pen’s pressure, or the speed of a mouse', () => {
        const pressure = createSignaturePressure();
        expect(pressure.at(0, 0, 0, 0.8)).toBe(0.8);
        pressure.start();
        expect(pressure.at(0, 0, 0)).toBe(0.5);
        const slow = pressure.at(1, 0, 16);
        pressure.start();
        pressure.at(0, 0, 0);
        const fast = pressure.at(80, 0, 16);
        expect(slow).toBeGreaterThan(fast);
        // A mouse reports 0.5 while pressed: that is not a pressure.
        pressure.start();
        expect(pressure.at(0, 0, 0, 0.5)).toBe(0.5);
    });

    it('saves varying ink as filled outlines', () => {
        const svg = signatureSVG([line], { width: 100, height: 100, color: 'navy', strokeWidth: 3, ink: { thinning: 0.5 } });
        expect(svg).toContain('<g fill="navy" stroke="none">');
        expect(svg).toContain('Z"/>');
    });
});
