import { describe, expect, it } from 'vitest';
import { addTags, removeTag, splitTags, tagKeyTarget, typeTags } from './tags';

describe('splitting text into tags', () => {
    it('splits on every separator it was given', () => {
        expect(splitTags('a,b')).toEqual(['a', 'b']);
        expect(splitTags('a,b;c', { separator: [',', ';'] })).toEqual(['a', 'b', 'c']);
        expect(splitTags('one line', { separator: [] })).toEqual(['one line']);
    });
});

describe('adding tags', () => {
    it('trims, splits and keeps the order', () => {
        expect(addTags([], ' one,  two ,three ')).toMatchObject({ tags: ['one', 'two', 'three'], text: '' });
        expect(addTags(['a'], 'b')).toMatchObject({ tags: ['a', 'b'] });
        expect(addTags([], '   ').tags).toEqual([]);
    });

    it('says what it refused, rather than dropping it quietly', () => {
        expect(addTags(['a'], 'a')).toMatchObject({ tags: ['a'], rejected: [{ tag: 'a', reason: 'duplicate' }] });
        expect(addTags(['a', 'b'], 'c', { max: 2 })).toMatchObject({ tags: ['a', 'b'], rejected: [{ tag: 'c', reason: 'max' }] });
        expect(addTags([], 'nope', { validate: (tag) => tag.length > 4 })).toMatchObject({ rejected: [{ tag: 'nope', reason: 'invalid' }] });
    });

    it('keeps a duplicate or the spaces when told to', () => {
        expect(addTags(['a'], 'a', { allowDuplicate: true }).tags).toEqual(['a', 'a']);
        expect(addTags([], ' a ', { keepSpace: true }).tags).toEqual([' a ']);
    });
});

describe('typing', () => {
    it('commits what has a separator after it and keeps the rest in the box', () => {
        expect(typeTags([], 'blue,')).toMatchObject({ tags: ['blue'], text: '' });
        expect(typeTags([], 'blue, gr')).toMatchObject({ tags: ['blue'], text: 'gr' });
        expect(typeTags(['blue'], 'green, red, ye')).toMatchObject({ tags: ['blue', 'green', 'red'], text: 'ye' });
    });

    it('says nothing while a tag is still being typed', () => {
        expect(typeTags([], 'blu')).toBeNull();
        expect(typeTags([], '')).toBeNull();
    });
});

describe('removing and walking', () => {
    it('takes one out by position and leaves the rest', () => {
        expect(removeTag(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
        expect(removeTag(['a'], 4)).toEqual(['a']);
        expect(removeTag([], 0)).toEqual([]);
    });

    it('walks from the box into the tags and back out', () => {
        // From the text box, back goes to the last tag.
        expect(tagKeyTarget('ArrowLeft', -1, 3)).toBe(2);
        expect(tagKeyTarget('ArrowLeft', 1, 3)).toBe(0);
        expect(tagKeyTarget('ArrowLeft', 0, 3)).toBe(0);
        // Forward from the last tag returns to the box.
        expect(tagKeyTarget('ArrowRight', 2, 3)).toBe(-1);
        expect(tagKeyTarget('ArrowRight', 0, 3)).toBe(1);
        expect(tagKeyTarget('Home', -1, 3)).toBe(0);
        expect(tagKeyTarget('End', -1, 3)).toBe(2);
        expect(tagKeyTarget('a', -1, 3)).toBeNull();
        expect(tagKeyTarget('ArrowLeft', -1, 0)).toBeNull();
    });

    it('swaps the arrows when the field reads right to left', () => {
        expect(tagKeyTarget('ArrowRight', -1, 3, true)).toBe(2);
        expect(tagKeyTarget('ArrowLeft', 2, 3, true)).toBe(-1);
    });
});
