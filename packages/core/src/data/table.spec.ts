import { describe, expect, it } from 'vitest';
import { flattenTree, sortTree } from './tree';
import { indexRange, selectionState, selectRows, sortOrderOf, toggleSort } from './table';
import { parentIndex, treeKeyAction } from '../a11y/treeNavigation';

describe('sort toggling', () => {
    it('cycles one column ascending, descending, and back — or off when removable', () => {
        let sort = toggleSort([], 'name');
        expect(sort).toEqual([{ field: 'name', order: 1 }]);
        sort = toggleSort(sort, 'name');
        expect(sort).toEqual([{ field: 'name', order: -1 }]);
        expect(toggleSort(sort, 'name')).toEqual([{ field: 'name', order: 1 }]);
        expect(toggleSort(sort, 'name', { removable: true })).toEqual([]);
    });

    it('replaces the sort on a plain activation, and adds to it on an additive one', () => {
        const two = toggleSort([{ field: 'city', order: 1 }], 'name', { multiple: true, additive: true });
        expect(two).toEqual([
            { field: 'city', order: 1 },
            { field: 'name', order: 1 }
        ]);
        expect(toggleSort(two, 'city', { multiple: true, additive: true })).toEqual([
            { field: 'city', order: -1 },
            { field: 'name', order: 1 }
        ]);
        expect(toggleSort(two, 'city', { multiple: true })).toEqual([{ field: 'city', order: -1 }]);
        expect(sortOrderOf(two, 'name')).toBe(1);
        expect(sortOrderOf(two, 'age')).toBe(0);
    });
});

describe('select all', () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];

    it('reports none, some or all of the rows as selected', () => {
        expect(selectionState(rows, [], 'id')).toBe('none');
        expect(selectionState(rows, [{ id: 2 }], 'id')).toBe('some');
        expect(selectionState(rows, [{ id: 3 }, { id: 1 }, { id: 2 }], 'id')).toBe('all');
        expect(selectionState([], [{ id: 1 }], 'id')).toBe('none');
    });

    it('adds or removes rows without touching the rest of the selection', () => {
        const elsewhere = { id: 9 };
        expect(selectRows([elsewhere, { id: 1 }], rows, true, 'id')).toEqual([elsewhere, { id: 1 }, { id: 2 }, { id: 3 }]);
        expect(selectRows([elsewhere, { id: 1 }], rows, false, 'id')).toEqual([elsewhere]);
        expect(indexRange(4, 1)).toEqual([1, 2, 3, 4]);
    });
});

describe('tree keyboard', () => {
    const nodes = [
        { key: 'a', label: 'Documents', children: [{ key: 'a1', label: 'Work', children: [{ key: 'a1x', label: 'Report' }] }, { key: 'a2', label: 'Home' }] },
        { key: 'b', label: 'Pictures', children: [{ key: 'b1', label: 'Trip' }] },
        { key: 'c', label: 'Notes' }
    ];

    it('steps, jumps, enters and leaves branches', () => {
        const flat = flattenTree(nodes, { a: true });
        // a, a1, a2, b, c
        expect(treeKeyAction(flat, 0, 'ArrowDown')).toEqual({ type: 'focus', index: 1 });
        expect(treeKeyAction(flat, 0, 'ArrowUp')).toEqual({ type: 'none' });
        expect(treeKeyAction(flat, 0, 'End')).toEqual({ type: 'focus', index: 4 });
        expect(treeKeyAction(flat, 0, 'ArrowRight')).toEqual({ type: 'focus', index: 1 });
        expect(treeKeyAction(flat, 1, 'ArrowRight')).toEqual({ type: 'expand', key: 'a1' });
        expect(treeKeyAction(flat, 2, 'ArrowRight')).toEqual({ type: 'none' });
        expect(treeKeyAction(flat, 2, 'ArrowLeft')).toEqual({ type: 'focus', index: 0 });
        expect(treeKeyAction(flat, 0, 'ArrowLeft')).toEqual({ type: 'collapse', key: 'a' });
        expect(parentIndex(flat, 3)).toBe(-1);
    });

    it('expands every closed sibling branch with *', () => {
        const flat = flattenTree(nodes, {});
        expect(treeKeyAction(flat, 2, '*')).toEqual({ type: 'expandAll', keys: ['a', 'b'] });
    });
});

describe('sortTree', () => {
    it('sorts every level by a data field, keeping the nesting', () => {
        const nodes = [
            { key: 'b', data: { size: 2 }, children: [{ key: 'b2', data: { size: 9 } }, { key: 'b1', data: { size: 1 } }] },
            { key: 'a', data: { size: 5 } }
        ];
        const sorted = sortTree(nodes, [{ field: 'data.size', order: -1 }]);
        expect(sorted.map((n) => n.key)).toEqual(['a', 'b']);
        expect(sorted[1]!.children!.map((n) => n.key)).toEqual(['b2', 'b1']);
        expect(sortTree(nodes, [])).toEqual(nodes);
        expect(nodes[0]!.children![0]!.key).toBe('b2');
    });
});
