import { describe, expect, it } from 'vitest';
import { boardFocusTarget, boardMoveTarget, cellEntries, columnCount, edgeScrollSpeed, insertionIndex, moveCard, positionOf, wipAllows, wipState, type BoardEntry } from './board';

const board = (): BoardEntry<string>[] => [
    { item: 'a', column: 'todo' },
    { item: 'b', column: 'doing' },
    { item: 'c', column: 'todo' },
    { item: 'd', column: 'done' },
    { item: 'e', column: 'todo' }
];
const cell = (entries: BoardEntry<string>[], column: string, lane?: string) => cellEntries(entries, column, lane).map((c) => c.entry.item);

describe('board moves', () => {
    it('reads a cell and a position out of the flat list', () => {
        expect(cell(board(), 'todo')).toEqual(['a', 'c', 'e']);
        expect(positionOf(board(), 4)).toEqual({ column: 'todo', lane: undefined, index: 2 });
        expect(columnCount(board(), 'todo')).toBe(3);
        expect(columnCount(board(), 'todo', 0)).toBe(3 - 1);
    });

    it('reorders within a cell', () => {
        const { entries, at } = moveCard(board(), 4, { column: 'todo', index: 0 });
        expect(cell(entries, 'todo')).toEqual(['e', 'a', 'c']);
        expect(positionOf(entries, at)?.index).toBe(0);
        expect(cell(moveCard(board(), 0, { column: 'todo', index: 2 }).entries, 'todo')).toEqual(['c', 'e', 'a']);
        expect(cell(moveCard(board(), 0, { column: 'todo', index: 1 }).entries, 'todo')).toEqual(['c', 'a', 'e']);
    });

    it('moves across columns, relabelling the item, into an empty cell too', () => {
        const relabel = (item: string, column: string | number) => `${item}@${column}`;
        const { entries, at } = moveCard(board(), 2, { column: 'doing', index: 0 }, relabel);
        expect(cell(entries, 'doing')).toEqual(['c@doing', 'b']);
        expect(cell(entries, 'todo')).toEqual(['a', 'e']);
        expect(entries[at]!.item).toBe('c@doing');
        const empty = moveCard(board(), 0, { column: 'review', index: 5 });
        expect(cell(empty.entries, 'review')).toEqual(['a']);
        expect(positionOf(empty.entries, empty.at)).toEqual({ column: 'review', lane: undefined, index: 0 });
    });

    it('moves between swimlanes', () => {
        const laned: BoardEntry<string>[] = [
            { item: 'a', column: 'todo', lane: 'x' },
            { item: 'b', column: 'todo', lane: 'y' },
            { item: 'c', column: 'todo', lane: 'x' }
        ];
        const { entries } = moveCard(laned, 0, { column: 'todo', lane: 'y', index: 1 });
        expect(cell(entries, 'todo', 'y')).toEqual(['b', 'a']);
        expect(cell(entries, 'todo', 'x')).toEqual(['c']);
    });

    it('holds a column to its work-in-progress limit, except for moves inside it', () => {
        expect(wipState(2, 3)).toBe('under');
        expect(wipState(3, 3)).toBe('at');
        expect(wipState(4, 3)).toBe('over');
        expect(wipState(10)).toBe('under');
        expect(wipAllows(3, 3, false)).toBe(false);
        expect(wipAllows(3, 3, true)).toBe(true);
        expect(wipAllows(2, 3, false)).toBe(true);
        expect(wipAllows(99, undefined, false)).toBe(true);
    });
});

describe('board keyboard', () => {
    const layout = { columns: ['todo', 'doing', 'done'], lanes: ['x', 'y'] };
    const counts: Record<string, number> = { 'todo/x': 3, 'doing/x': 1, 'done/x': 0, 'todo/y': 0, 'doing/y': 2, 'done/y': 0 };
    const count = (c: string | number, l: string | number | undefined) => counts[`${c}/${l}`] ?? 0;

    it('moves a picked-up card along the cell, across columns and lanes', () => {
        const at = { column: 'todo', lane: 'x', index: 2 };
        expect(boardMoveTarget(at, 'ArrowUp', layout, count)).toEqual({ column: 'todo', lane: 'x', index: 1 });
        expect(boardMoveTarget(at, 'ArrowDown', layout, count)).toEqual({ column: 'todo', lane: 'x', index: 3 });
        expect(boardMoveTarget(at, 'Home', layout, count)?.index).toBe(0);
        expect(boardMoveTarget(at, 'ArrowRight', layout, count)).toEqual({ column: 'doing', lane: 'x', index: 1 });
        expect(boardMoveTarget(at, 'ArrowLeft', layout, count)).toEqual(at);
        expect(boardMoveTarget(at, 'ArrowLeft', layout, count, { rtl: true })?.column).toBe('doing');
        expect(boardMoveTarget(at, 'PageDown', layout, count)).toEqual({ column: 'todo', lane: 'y', index: 0 });
        expect(boardMoveTarget(at, 'ArrowDown', layout, count, { ctrlKey: true })?.lane).toBe('y');
        expect(boardMoveTarget(at, 'x', layout, count)).toBeNull();
    });

    it('skips collapsed columns', () => {
        const at = { column: 'todo', lane: 'x', index: 0 };
        expect(boardMoveTarget(at, 'ArrowRight', { ...layout, skipColumn: (c) => c === 'doing' }, count)?.column).toBe('done');
    });

    it('moves focus only onto cards that exist', () => {
        const at = { column: 'todo', lane: 'x', index: 2 };
        expect(boardFocusTarget(at, 'ArrowDown', layout, count)).toBeNull();
        expect(boardFocusTarget(at, 'ArrowUp', layout, count)?.index).toBe(1);
        expect(boardFocusTarget(at, 'ArrowRight', layout, count)).toEqual({ column: 'doing', lane: 'x', index: 0 });
        expect(boardFocusTarget({ column: 'doing', lane: 'x', index: 0 }, 'ArrowRight', layout, count)).toBeNull();
        expect(boardFocusTarget({ column: 'doing', lane: 'x', index: 0 }, 'PageDown', layout, count)).toEqual({ column: 'doing', lane: 'y', index: 0 });
        expect(boardFocusTarget(at, 'End', layout, count)?.index).toBe(2);
    });
});

describe('drag geometry', () => {
    it('finds the insertion index from midpoints', () => {
        expect(insertionIndex([10, 30, 50], 5)).toBe(0);
        expect(insertionIndex([10, 30, 50], 31)).toBe(2);
        expect(insertionIndex([10, 30, 50], 99)).toBe(3);
        expect(insertionIndex([], 99)).toBe(0);
    });

    it('scrolls faster the nearer the pointer is to an edge', () => {
        expect(edgeScrollSpeed(200, 0, 400)).toBe(0);
        expect(edgeScrollSpeed(0, 0, 400)).toBe(-16);
        expect(edgeScrollSpeed(20, 0, 400)).toBe(-8);
        expect(edgeScrollSpeed(400, 0, 400)).toBe(16);
        expect(edgeScrollSpeed(500, 0, 400)).toBe(16);
        expect(edgeScrollSpeed(10, 0, 0)).toBe(0);
    });
});
