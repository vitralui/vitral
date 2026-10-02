import { describe, expect, it } from 'vitest';
import { arrangeToasts, toastToReplace } from './toasts';

const t = (id: number, pinned = false) => ({ id, pinned });
const ids = (list: { id: number }[]) => list.map((item) => item.id);

describe('arranging toasts', () => {
    it('shows everything in arrival order by default, pinned ones first', () => {
        const { shown, waiting } = arrangeToasts([t(1), t(2, true), t(3)]);
        expect(ids(shown)).toEqual([2, 1, 3]);
        expect(waiting).toEqual([]);
    });

    it('lets the newer ones wait once max is reached, pinned ones always shown', () => {
        const { shown, waiting } = arrangeToasts([t(1), t(2), t(3, true), t(4)], { max: 3 });
        expect(ids(shown)).toEqual([3, 1, 2]);
        expect(ids(waiting)).toEqual([4]);
        expect(ids(arrangeToasts([t(1, true), t(2, true), t(3)], { max: 2 }).shown)).toEqual([1, 2]);
    });

    it('puts the newest at the head of each part when asked', () => {
        expect(ids(arrangeToasts([t(1), t(2, true), t(3), t(4, true)], { newestFirst: true }).shown)).toEqual([4, 2, 3, 1]);
    });

    it('picks the oldest unpinned toast to replace once the room is full', () => {
        expect(toastToReplace([t(1), t(2)], 3)).toBeNull();
        expect(toastToReplace([t(1, true), t(2), t(3)], 3)?.id).toBe(2);
        expect(toastToReplace([t(1, true)], 1)).toBeNull();
        expect(toastToReplace([t(1)], undefined)).toBeNull();
    });
});
