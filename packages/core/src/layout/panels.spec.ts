import { describe, expect, it } from 'vitest';
import { toCssLength } from './length';
import { dockLayout, dockTemplateAreas, normalizeDockOrder, uniformGridSize } from './panels';

describe('lengths', () => {
    it('reads numbers as pixels and passes CSS through', () => {
        expect(toCssLength(12)).toBe('12px');
        expect(toCssLength('12')).toBe('12px');
        expect(toCssLength('1.5rem')).toBe('1.5rem');
        expect(toCssLength('var(--gap)')).toBe('var(--gap)');
        expect(toCssLength(undefined)).toBeUndefined();
        expect(toCssLength('  ')).toBeUndefined();
        expect(toCssLength(Number.NaN)).toBeUndefined();
    });
});

describe('uniform grid', () => {
    it('makes a square just big enough when neither dimension is given', () => {
        expect(uniformGridSize({ count: 9 })).toEqual({ rows: 3, columns: 3, firstColumn: 0 });
        expect(uniformGridSize({ count: 5 })).toEqual({ rows: 3, columns: 3, firstColumn: 0 });
        expect(uniformGridSize({ count: 0 })).toEqual({ rows: 1, columns: 1, firstColumn: 0 });
    });

    it('derives the missing dimension from the number of children', () => {
        expect(uniformGridSize({ count: 7, columns: 3 })).toEqual({ rows: 3, columns: 3, firstColumn: 0 });
        expect(uniformGridSize({ count: 7, rows: 2 })).toEqual({ rows: 2, columns: 4, firstColumn: 0 });
        expect(uniformGridSize({ count: 4, rows: 3, columns: 5 })).toEqual({ rows: 3, columns: 5, firstColumn: 0 });
    });

    it('counts the first-column offset as cells, and only when it fits in the columns', () => {
        expect(uniformGridSize({ count: 6, columns: 3, firstColumn: 2 })).toEqual({ rows: 3, columns: 3, firstColumn: 2 });
        expect(uniformGridSize({ count: 6, columns: 3, firstColumn: 3 })).toEqual({ rows: 2, columns: 3, firstColumn: 0 });
        expect(uniformGridSize({ count: 6, firstColumn: 1 })).toEqual({ rows: 3, columns: 3, firstColumn: 0 });
    });
});

describe('dock panel', () => {
    it('fills in missing edges in the default order and ignores the rest', () => {
        expect(normalizeDockOrder(undefined)).toEqual(['top', 'bottom', 'left', 'right']);
        expect(normalizeDockOrder(['left', 'left', 'nope', 'top'])).toEqual(['left', 'top', 'bottom', 'right']);
        expect(normalizeDockOrder('Right, left')).toEqual(['right', 'left', 'top', 'bottom']);
    });

    it('lets top and bottom span the full width by default', () => {
        const layout = dockLayout(['top', 'bottom', 'left', 'right']);
        expect(layout.columns).toEqual(['left', 'fill', 'right']);
        expect(layout.rows).toEqual(['top', 'fill', 'bottom']);
        expect(dockTemplateAreas(layout)).toBe('"top top top" "left fill right" "bottom bottom bottom"');
    });

    it('lets left and right span the full height when they dock first', () => {
        const layout = dockLayout(['top', 'bottom', 'left', 'right'], ['left', 'right']);
        expect(dockTemplateAreas(layout)).toBe('"left top right" "left fill right" "left bottom right"');
    });

    it('takes corners edge by edge, in any order', () => {
        const layout = dockLayout(['top', 'bottom', 'left', 'right'], ['top', 'left', 'bottom', 'right']);
        expect(dockTemplateAreas(layout)).toBe('"top top top" "left fill right" "left bottom bottom"');
    });

    it('leaves out the tracks of edges that are not there', () => {
        expect(dockTemplateAreas(dockLayout(['left']))).toBe('"left fill"');
        expect(dockTemplateAreas(dockLayout(['bottom', 'right'], ['right']))).toBe('"fill right" "bottom right"');
        expect(dockTemplateAreas(dockLayout([]))).toBe('"fill"');
    });
});
