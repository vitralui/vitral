import { describe, expect, it } from 'vitest';
import { isExpanded, rovingIndex, rovingMove, toggleExpanded } from '../index';

describe('roving focus', () => {
    it('reads arrows by orientation, and swaps Left/Right in right-to-left text', () => {
        expect(rovingMove('ArrowRight', { orientation: 'horizontal' })).toBe('next');
        expect(rovingMove('ArrowDown', { orientation: 'horizontal' })).toBeNull();
        expect(rovingMove('ArrowDown', { orientation: 'vertical' })).toBe('next');
        expect(rovingMove('ArrowLeft', { orientation: 'vertical' })).toBeNull();
        expect(rovingMove('ArrowLeft', { orientation: 'horizontal', rtl: true })).toBe('next');
        expect(rovingMove('ArrowUp')).toBe('previous');
        expect(rovingMove('Home')).toBe('first');
        expect(rovingMove('End', { homeEnd: false })).toBeNull();
        expect(rovingMove('a')).toBeNull();
    });

    it('moves across enabled items, wrapping unless told not to', () => {
        const off = (i: number) => i === 1;
        expect(rovingIndex('next', 4, 0, off)).toBe(2);
        expect(rovingIndex('next', 4, 3, off)).toBe(0);
        expect(rovingIndex('next', 4, 3, off, false)).toBe(3);
        expect(rovingIndex('previous', 4, 2, off)).toBe(0);
        expect(rovingIndex('previous', 4, -1)).toBe(3);
        expect(rovingIndex('next', 4, -1, (i) => i === 0)).toBe(1);
        expect(rovingIndex('first', 4, 2, (i) => i === 0)).toBe(1);
        expect(rovingIndex('last', 4, 0, (i) => i === 3)).toBe(2);
        expect(rovingIndex('next', 0, -1)).toBe(-1);
    });
});

describe('expansion', () => {
    it('keeps one key open, or a list of them', () => {
        expect(isExpanded('a', 'a')).toBe(true);
        expect(isExpanded(['a', 'b'], 'b')).toBe(true);
        expect(isExpanded(null, 'a')).toBe(false);
        expect(toggleExpanded('a', 'b', false)).toBe('b');
        expect(toggleExpanded('a', 'a', false)).toBeNull();
        expect(toggleExpanded(['a'], 'b', true)).toEqual(['a', 'b']);
        expect(toggleExpanded(['a', 'b'], 'a', true)).toEqual(['b']);
        expect(toggleExpanded('a', 'b', true)).toEqual(['a', 'b']);
        expect(toggleExpanded(undefined, 0, true)).toEqual([0]);
    });
});
