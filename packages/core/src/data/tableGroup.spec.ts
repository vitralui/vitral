import { describe, expect, it, vi } from 'vitest';
import { layoutFor, tableBus } from './tableGroup';

describe('the table group bus', () => {
    it('carries a message to everyone listening but nobody else', () => {
        const here = vi.fn();
        const elsewhere = vi.fn();
        const stop = tableBus.subscribe('books', here);
        tableBus.subscribe('films', elsewhere);
        tableBus.publish('books', { kind: 'scroll', source: 'a', left: 120 });
        expect(here).toHaveBeenCalledWith({ kind: 'scroll', source: 'a', left: 120 });
        expect(elsewhere).not.toHaveBeenCalled();
        stop();
        tableBus.publish('books', { kind: 'scroll', source: 'a', left: 0 });
        expect(here).toHaveBeenCalledTimes(1);
    });
});

describe('the part of a shared layout that applies to a table', () => {
    const keys = ['name', 'city'];

    it('takes the widths and pins of the columns it has, and leaves the rest', () => {
        const shared = { widths: { name: 120, city: 90, country: 200 }, pinned: { name: 'left' as const, country: 'right' as const }, order: ['country', 'city', 'name'], hidden: ['country'] };
        expect(layoutFor(keys, shared, null)).toEqual({
            order: ['city', 'name'],
            widths: { name: 120, city: 90 },
            hidden: [],
            pinned: { name: 'left' }
        });
    });

    it('keeps its own layout where the group says nothing', () => {
        const own = { widths: { name: 300 }, pinned: { city: 'right' as const } };
        expect(layoutFor(keys, { widths: { city: 90 } }, own)).toMatchObject({ widths: { name: 300, city: 90 }, pinned: { city: 'right' } });
        expect(layoutFor(keys, null, own)).toEqual(own);
    });
});
