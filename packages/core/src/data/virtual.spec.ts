import { describe, expect, it } from 'vitest';
import { moveItem, moveItems, transferItems } from './reorder';
import { scrollOffsetFor, virtualWindow } from './virtual';

describe('virtualWindow', () => {
    it('renders the visible items and the overscan around them', () => {
        expect(virtualWindow({ scrollOffset: 0, viewportSize: 100, itemSize: 20, count: 1000, overscan: 2 })).toEqual({
            first: 0,
            last: 7,
            offset: 0,
            totalSize: 20000,
            visibleFirst: 0,
            visibleLast: 5
        });
        const mid = virtualWindow({ scrollOffset: 510, viewportSize: 100, itemSize: 20, count: 1000, overscan: 2 });
        expect(mid).toMatchObject({ first: 23, last: 33, offset: 460, visibleFirst: 25, visibleLast: 31 });
    });

    it('stays inside the list at the end and when the viewport is larger than it', () => {
        expect(virtualWindow({ scrollOffset: 99999, viewportSize: 100, itemSize: 20, count: 50, overscan: 1 })).toMatchObject({ first: 44, last: 50, visibleLast: 50 });
        expect(virtualWindow({ scrollOffset: 0, viewportSize: 500, itemSize: 20, count: 3 })).toMatchObject({ first: 0, last: 3, totalSize: 60 });
        expect(virtualWindow({ scrollOffset: 0, viewportSize: 0, itemSize: 20, count: 10, overscan: 0 })).toMatchObject({ first: 0, last: 1 });
        expect(virtualWindow({ scrollOffset: 0, viewportSize: 100, itemSize: 20, count: 0 })).toMatchObject({ first: 0, last: 0, totalSize: 0 });
    });

    it('overscans half a viewport by default', () => {
        expect(virtualWindow({ scrollOffset: 400, viewportSize: 100, itemSize: 20, count: 100 })).toMatchObject({ first: 17, last: 28 });
    });

    it('scrolls an item into view as little as needed', () => {
        expect(scrollOffsetFor(10, 20, 100, 0)).toBe(120);
        expect(scrollOffsetFor(2, 20, 100, 100)).toBe(40);
        expect(scrollOffsetFor(6, 20, 100, 100)).toBe(100);
        expect(scrollOffsetFor(6, 20, 100, 100, 'start')).toBe(120);
        expect(scrollOffsetFor(6, 20, 100, 0, 'end')).toBe(40);
    });
});

describe('reordering', () => {
    const list = ['a', 'b', 'c', 'd', 'e'];

    it('moves a selection one step, keeping its order and closing up at an edge', () => {
        expect(moveItems(list, [1, 3], 'up')).toEqual({ list: ['b', 'a', 'd', 'c', 'e'], indices: [0, 2] });
        expect(moveItems(list, [0, 2], 'up')).toEqual({ list: ['a', 'c', 'b', 'd', 'e'], indices: [0, 1] });
        expect(moveItems(list, [0, 1], 'up')).toEqual({ list, indices: [0, 1] });
        expect(moveItems(list, [3, 4], 'down')).toEqual({ list, indices: [3, 4] });
        expect(moveItems(list, [1, 4], 'down')).toEqual({ list: ['a', 'c', 'b', 'd', 'e'], indices: [2, 4] });
        expect(moveItems(list, [], 'down')).toEqual({ list, indices: [] });
    });

    it('moves a selection to either end', () => {
        expect(moveItems(list, [3, 1], 'top')).toEqual({ list: ['b', 'd', 'a', 'c', 'e'], indices: [0, 1] });
        expect(moveItems(list, [0, 2], 'bottom')).toEqual({ list: ['b', 'd', 'e', 'a', 'c'], indices: [3, 4] });
    });

    it('moves one item to a new place, as a drop does', () => {
        expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd', 'e']);
        expect(moveItem(list, 4, 0)).toEqual(['e', 'a', 'b', 'c', 'd']);
        expect(moveItem(list, 9, 0)).toEqual(list);
    });

    it('transfers items to the end of the other list', () => {
        expect(transferItems(list, ['x'], [4, 1])).toEqual({ source: ['a', 'c', 'd'], target: ['x', 'b', 'e'], indices: [1, 2] });
        expect(transferItems(list, [], [])).toEqual({ source: list, target: [], indices: [] });
    });
});
