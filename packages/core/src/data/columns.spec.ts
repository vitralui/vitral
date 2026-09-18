import { describe, expect, it } from 'vitest';
import { dropTarget, isColumnVisible, moveColumn, orderColumns, pinColumn, resizeColumn, stickyOffsets, toggleColumn } from './columns';

const keys = ['name', 'role', 'city', 'joined'];

describe('the order columns are drawn in', () => {
    it('is the declared one until the layout says otherwise', () => {
        expect(orderColumns(keys)).toEqual(keys);
        expect(orderColumns(keys, { order: ['city', 'name'] })).toEqual(['city', 'name', 'role', 'joined']);
        // A key the table no longer has is ignored rather than drawn empty.
        expect(orderColumns(keys, { order: ['gone', 'role'] })).toEqual(['role', 'name', 'city', 'joined']);
    });

    it('puts the pinned ones at the edges, keeping their order among themselves', () => {
        const layout = { pinned: { city: 'left' as const, name: 'right' as const } };
        expect(orderColumns(keys, layout)).toEqual(['city', 'role', 'joined', 'name']);
    });

    it('leaves out what is hidden', () => {
        expect(orderColumns(keys, { hidden: ['role'] })).toEqual(['name', 'city', 'joined']);
        expect(isColumnVisible('role', { hidden: ['role'] })).toBe(false);
        expect(isColumnVisible('name', { hidden: ['role'] })).toBe(true);
    });
});

describe('showing and hiding', () => {
    it('swaps when it is not told which way', () => {
        expect(toggleColumn(null, 'role').hidden).toEqual(['role']);
        expect(toggleColumn({ hidden: ['role'] }, 'role').hidden).toEqual([]);
        expect(toggleColumn({ hidden: ['role'] }, 'role', false).hidden).toEqual(['role']);
        expect(toggleColumn({ hidden: [] }, 'role', true).hidden).toEqual([]);
    });
});

describe('moving a column', () => {
    it('lands it before the one named, and at the end without one', () => {
        expect(moveColumn(null, keys, 'joined', 'role').order).toEqual(['name', 'joined', 'role', 'city']);
        expect(moveColumn(null, keys, 'name', null).order).toEqual(['role', 'city', 'joined', 'name']);
        // Writing the order out in full is what makes the next move meaningful.
        expect(moveColumn({ order: ['role', 'name', 'city', 'joined'] }, keys, 'city', 'role').order).toEqual(['city', 'role', 'name', 'joined']);
    });

    it('does nothing when the move is not a move', () => {
        expect(moveColumn(null, keys, 'name', 'name').order).toEqual([]);
        expect(moveColumn(null, keys, 'ghost', 'role').order).toEqual([]);
        expect(moveColumn(null, keys, 'name', 'ghost').order).toEqual([]);
    });
});

describe('resizing', () => {
    it('widens one column and lets the table grow', () => {
        const layout = resizeColumn({ widths: { name: 120 } }, 'name', 30);
        expect(layout.widths).toEqual({ name: 150 });
    });

    it('never goes below the minimum', () => {
        expect(resizeColumn({ widths: { name: 60 } }, 'name', -100).widths!.name).toBe(48);
        expect(resizeColumn({ widths: { name: 60 } }, 'name', -100, { min: 80 }).widths!.name).toBe(80);
    });

    it('takes from the next column when the table has to keep its width', () => {
        const layout = resizeColumn({ widths: { name: 120, role: 200 } }, 'name', 40, { mode: 'fit', next: 'role' });
        expect(layout.widths).toEqual({ name: 160, role: 160 });
        // The pair keeps its total, and neither end crosses the minimum.
        const clamped = resizeColumn({ widths: { name: 120, role: 60 } }, 'name', 400, { mode: 'fit', next: 'role', min: 50 });
        expect(clamped.widths).toEqual({ name: 130, role: 50 });
        expect(clamped.widths!.name + clamped.widths!.role).toBe(180);
    });

    it('starts from what the column measures when the layout has no width for it', () => {
        expect(resizeColumn(null, 'name', 20, { measured: { name: 100 } }).widths).toEqual({ name: 120 });
    });
});

describe('where the pinned columns sit', () => {
    const widths = { name: 100, role: 80, city: 120, joined: 90 };

    it('stacks them from their own edge', () => {
        const layout = { widths, pinned: { name: 'left' as const, role: 'left' as const, joined: 'right' as const } };
        const ordered = orderColumns(keys, layout);
        const sticky = stickyOffsets(ordered, layout);
        expect(sticky.name).toEqual({ side: 'left', offset: 0, last: false });
        expect(sticky.role).toEqual({ side: 'left', offset: 100, last: true });
        expect(sticky.joined).toEqual({ side: 'right', offset: 0, last: true });
        expect(sticky.city).toBeUndefined();
    });

    it('counts two on the right from the right', () => {
        const layout = { widths, pinned: { city: 'right' as const, joined: 'right' as const } };
        const sticky = stickyOffsets(orderColumns(keys, layout), layout);
        expect(sticky.joined).toEqual({ side: 'right', offset: 0, last: false });
        expect(sticky.city).toEqual({ side: 'right', offset: 90, last: true });
    });

    it('takes the measured width when the layout has none', () => {
        const sticky = stickyOffsets(['a', 'b'], { pinned: { a: 'left', b: 'left' } }, { a: 70 });
        expect(sticky.b!.offset).toBe(70);
    });
});

describe('pinning and dropping', () => {
    it('sticks a column to a side and lets it go again', () => {
        expect(pinColumn(null, 'name', 'left').pinned).toEqual({ name: 'left' });
        expect(pinColumn({ pinned: { name: 'left' } }, 'name', null).pinned).toEqual({});
    });

    it('drops before the header the pointer is over the first half of', () => {
        const edges = [
            { key: 'a', left: 0, right: 100 },
            { key: 'b', left: 100, right: 200 }
        ];
        expect(dropTarget(edges, 10)).toBe('a');
        expect(dropTarget(edges, 120)).toBe('b');
        expect(dropTarget(edges, 180)).toBeNull();
    });
});
