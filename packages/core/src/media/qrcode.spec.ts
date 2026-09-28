import { describe, expect, it } from 'vitest';
import { encodeQR, qrModeOf, qrPath } from './qrcode';

const finderAt = (m: boolean[][], x: number, y: number) =>
    [0, 1, 2, 3, 4, 5, 6].every((i) => m[y]![x + i] && m[y + 6]![x + i] && m[y + i]![x] && m[y + i]![x + 6]) && m[y + 3]![x + 3] && !m[y + 1]![x + 1];

describe('a QR Code', () => {
    it('picks the tightest encoding for the text', () => {
        expect(qrModeOf('0123')).toBe('numeric');
        expect(qrModeOf('HELLO WORLD')).toBe('alphanumeric');
        expect(qrModeOf('hello')).toBe('byte');
    });

    it('is as large as its version, with a finder pattern in three corners', () => {
        const code = encodeQR('HELLO WORLD', { ecc: 'Q', boostEcc: false });
        expect(code.version).toBe(1);
        expect(code.size).toBe(21);
        expect(finderAt(code.modules, 0, 0)).toBe(true);
        expect(finderAt(code.modules, 14, 0)).toBe(true);
        expect(finderAt(code.modules, 0, 14)).toBe(true);
        // The dark module beside the bottom-left finder, always there.
        expect(code.modules[code.size - 8]![8]).toBe(true);
    });

    it('grows a version when the text needs it, and raises the level when it fits anyway', () => {
        expect(encodeQR('a'.repeat(17), { ecc: 'L', boostEcc: false }).version).toBe(1);
        expect(encodeQR('a'.repeat(18), { ecc: 'L', boostEcc: false }).version).toBe(2);
        expect(encodeQR('HI', { ecc: 'L' }).ecc).toBe('H');
    });

    it('keeps the mask it is given, and refuses a text too long for any version', () => {
        expect(encodeQR('x', { mask: 5 }).mask).toBe(5);
        expect(() => encodeQR('x'.repeat(3000), { ecc: 'H' })).toThrow(RangeError);
    });

    it('draws the dark squares as one path of rows, inside a quiet margin', () => {
        const code = encodeQR('A', { ecc: 'L', boostEcc: false });
        const d = qrPath(code, 4);
        expect(d.startsWith('M4,4h7v1h-7z')).toBe(true);
    });
});
