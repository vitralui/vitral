import { describe, expect, it } from 'vitest';
import { cloneValue, deleteIn, getIn, isEmptyValue, isEqual, isPathWithin, joinPath, parsePath, setIn, toPath } from './path';

describe('paths', () => {
    it('parses dotted and bracketed paths alike', () => {
        expect(parsePath('email')).toEqual(['email']);
        expect(parsePath('address.city')).toEqual(['address', 'city']);
        expect(parsePath('items[0].title')).toEqual(['items', 0, 'title']);
        expect(parsePath('items.0.title')).toEqual(['items', 0, 'title']);
        expect(parsePath("map['key'].x")).toEqual(['map', 'key', 'x']);
        expect(parsePath('')).toEqual([]);
        expect(parsePath(['items', '2'])).toEqual(['items', 2]);
    });

    it('normalises every spelling to the dotted form', () => {
        expect(toPath('items[0].title')).toBe('items.0.title');
        expect(toPath(['items', 0, 'title'])).toBe('items.0.title');
        expect(toPath([{ key: 'items' }, { key: 1 }])).toBe('items.1');
        expect(joinPath('items', 2, undefined, 'title')).toBe('items.2.title');
    });

    it('knows when a path lies inside another', () => {
        expect(isPathWithin('items.0.title', 'items')).toBe(true);
        expect(isPathWithin('items', 'items')).toBe(true);
        expect(isPathWithin('itemsCount', 'items')).toBe(false);
        expect(isPathWithin('anything', '')).toBe(true);
    });

    it('reads nested values and tolerates gaps', () => {
        const values = { a: { b: [{ c: 1 }] } };
        expect(getIn(values, 'a.b.0.c')).toBe(1);
        expect(getIn(values, 'a.b[0].c')).toBe(1);
        expect(getIn(values, 'a.x.y')).toBeUndefined();
        expect(getIn(null, 'a')).toBeUndefined();
    });

    it('writes immutably, copying only the containers on the path', () => {
        const values = { a: { b: 1 }, other: { keep: true } };
        const next = setIn(values, 'a.b', 2);
        expect(next).toEqual({ a: { b: 2 }, other: { keep: true } });
        expect(values.a.b).toBe(1);
        expect(next.other).toBe(values.other);
        expect(next.a).not.toBe(values.a);
    });

    it('creates missing arrays for index segments and objects otherwise', () => {
        expect(setIn({}, 'list.1.name', 'x')).toEqual({ list: [undefined, { name: 'x' }] });
        expect(Array.isArray((setIn({}, 'list.0', 'x') as { list: unknown }).list)).toBe(true);
        expect(setIn({ list: ['a', 'b'] }, 'list.1', 'c')).toEqual({ list: ['a', 'c'] });
    });

    it('deletes keys and splices array items', () => {
        expect(deleteIn({ a: 1, b: 2 }, 'a')).toEqual({ b: 2 });
        expect(deleteIn({ list: ['a', 'b', 'c'] }, 'list.1')).toEqual({ list: ['a', 'c'] });
        expect(deleteIn({ a: { b: 1, c: 2 } }, 'a.b')).toEqual({ a: { c: 2 } });
        expect(deleteIn({ a: 1 }, 'x.y')).toEqual({ a: 1 });
    });

    it('compares structurally, dates included', () => {
        expect(isEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
        expect(isEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
        expect(isEqual(new Date(5), new Date(5))).toBe(true);
        expect(isEqual([1], [1, 2])).toBe(false);
        expect(isEqual(NaN, NaN)).toBe(true);
    });

    it('clones plain data deeply and keeps other objects by reference', () => {
        class Box {}
        const box = new Box();
        const date = new Date(1);
        const source = { a: [{ b: 1 }], date, box };
        const copy = cloneValue(source);
        expect(copy).toEqual(source);
        expect(copy.a[0]).not.toBe(source.a[0]);
        expect(copy.date).not.toBe(date);
        expect(copy.date.getTime()).toBe(1);
        expect(copy.box).toBe(box);
    });

    it('treats blank text, empty lists and invalid dates as empty', () => {
        for (const value of [undefined, null, '', '   ', [], NaN, new Date('x')]) expect(isEmptyValue(value)).toBe(true);
        for (const value of [0, false, 'a', [0], new Date(), {}]) expect(isEmptyValue(value)).toBe(false);
    });
});
