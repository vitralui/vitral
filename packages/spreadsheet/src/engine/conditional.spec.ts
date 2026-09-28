import { describe, expect, it } from 'vitest';
import { keyOf, parseRef } from './a1';
import { conditionalLooks, testCondition } from './conditional';
import type { CellAddress, Scalar } from './types';

const sheet = (cells: Record<string, Scalar>) => (address: CellAddress) => {
    for (const [ref, v] of Object.entries(cells)) {
        const r = parseRef(ref)!;
        if (r.row === address.row && r.col === address.col) return v;
    }
    return null;
};

describe('conditional formatting', () => {
    it('tests a value the way a spreadsheet compares', () => {
        expect(testCondition({ op: '>', value: 10 }, 12)).toBe(true);
        expect(testCondition({ op: '>', value: '10' }, 9)).toBe(false);
        expect(testCondition({ op: '<', value: 10 }, null)).toBe(false);
        expect(testCondition({ op: 'between', value: 5, to: 1 }, 3)).toBe(true);
        expect(testCondition({ op: 'contains', value: 'late' }, 'Very LATE')).toBe(true);
        expect(testCondition({ op: '=', value: 'done' }, 'Done')).toBe(true);
        expect(testCondition({ op: 'error' }, { error: '#DIV/0!' })).toBe(true);
        expect(testCondition({ op: 'empty' }, '')).toBe(true);
    });

    it('highlights, shades and measures, the earlier rule winning', () => {
        const looks = conditionalLooks(
            [
                { range: 'A1:A3', when: { op: '>=', value: 30 }, style: { tone: 'success', bold: true } },
                { range: 'A1:A3', when: (v) => typeof v === 'number', style: { tone: 'danger', italic: true } },
                { type: 'colorScale', range: 'A1:A3', colors: ['white', 'green'] },
                { type: 'dataBar', range: 'B1:B2' }
            ],
            sheet({ A1: 10, A2: 20, A3: 30, B1: 5, B2: 20 })
        );
        const at = (ref: string) => looks.get(keyOf(parseRef(ref)!));
        expect(at('A3')).toMatchObject({ tone: 'success', bold: true, italic: true, background: 'green' });
        expect(at('A1')).toMatchObject({ tone: 'danger', background: 'white' });
        expect(at('A2')!.background).toBe('color-mix(in srgb, green 50%, white)');
        expect(at('B1')!.bar).toBe(0.25);
        expect(at('B2')!.bar).toBe(1);
    });
});
