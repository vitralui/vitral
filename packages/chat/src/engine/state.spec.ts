import { describe, expect, it } from 'vitest';
import { formatSize, groupMessages, initialsOf, messageKeyTarget, sideOf } from './state';
import type { ChatMessage } from './types';

const m = (id: number, role: ChatMessage['role'], author?: string): ChatMessage => ({ id, role, author, content: `m${id}` });

describe('the shape of a thread', () => {
    it('gathers a speaker’s run into one group, so a thread reads as speech', () => {
        const groups = groupMessages([m(1, 'user'), m(2, 'user'), m(3, 'assistant'), m(4, 'user')]);
        expect(groups.map((g) => g.messages.map((x) => x.id))).toEqual([[1, 2], [3], [4]]);
        expect(groups.map((g) => g.start)).toEqual([0, 2, 3]);
    });

    it('keeps two speakers of the same role apart, and never folds a system note in', () => {
        expect(groupMessages([m(1, 'user', 'Ana'), m(2, 'user', 'Bruno')]).length).toBe(2);
        // A note is about the conversation, not a turn in it.
        expect(groupMessages([m(1, 'system'), m(2, 'system')]).length).toBe(2);
    });

    it('puts the reader on one side and the answer on the other', () => {
        expect([sideOf('user'), sideOf('assistant'), sideOf('system')]).toEqual(['own', 'other', 'none']);
    });

    it('falls back to initials when a speaker has no picture', () => {
        expect(initialsOf(m(1, 'user', 'Ada Lovelace'))).toBe('AL');
        expect(initialsOf(m(1, 'user', 'Grace'))).toBe('GR');
        expect(initialsOf({ id: 1, role: 'assistant' })).toBe('AI');
        expect(initialsOf({ id: 1, role: 'user', initials: '!' })).toBe('!');
    });

    it('reads a file size the way a person does', () => {
        expect(formatSize(940)).toBe('940 B');
        expect(formatSize(2400)).toBe('2.4 kB');
        expect(formatSize(24_000)).toBe('24 kB');
        expect(formatSize(5_400_000)).toBe('5.4 MB');
        expect(formatSize(undefined)).toBeUndefined();
        expect(formatSize(-1)).toBeUndefined();
    });

    it('moves the tab stop with the arrows and stops at either end', () => {
        expect(messageKeyTarget(0, 'ArrowDown', 5)).toBe(1);
        expect(messageKeyTarget(4, 'ArrowDown', 5)).toBe(4);
        expect(messageKeyTarget(0, 'ArrowUp', 5)).toBe(0);
        expect(messageKeyTarget(2, 'Home', 5)).toBe(0);
        expect(messageKeyTarget(2, 'End', 5)).toBe(4);
        expect(messageKeyTarget(0, 'PageDown', 20)).toBe(5);
        // Anything else belongs to whatever else is listening.
        expect(messageKeyTarget(0, 'Enter', 5)).toBe(-1);
        expect(messageKeyTarget(0, 'ArrowDown', 0)).toBe(-1);
    });
});
