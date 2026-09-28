import { describe, expect, it } from 'vitest';
import { editorNodes as ed } from './model';
import { createState } from './state';
import { expandEditorReplacement, findInEditor, replaceEditorMatches } from './find';
import { toEditorText } from './text';

const doc = ed.doc(ed.p('The cat sat. ', ed.t('Cat', ed.bold()), ' category'), ed.code('cat = 1'));

describe('find and replace', () => {
    it('finds across blocks, case-insensitive by default', () => {
        expect(findInEditor(doc, 'cat').map((m) => [m.path, m.from, m.to])).toEqual([
            [[0], 4, 7],
            [[0], 13, 16],
            [[0], 17, 20],
            [[1], 0, 3]
        ]);
    });

    it('can match case and whole words only', () => {
        expect(findInEditor(doc, 'Cat', { caseSensitive: true })).toHaveLength(1);
        expect(findInEditor(doc, 'cat', { wholeWord: true })).toHaveLength(3);
    });

    it('reads a regular expression, and gives nothing for one that does not parse', () => {
        const matches = findInEditor(doc, '(c)at', { regex: true, caseSensitive: true });
        expect(matches).toHaveLength(3);
        expect(expandEditorReplacement('$1ow-$&', matches[0]!, true)).toBe('cow-cat');
        expect(findInEditor(doc, '(', { regex: true })).toEqual([]);
    });

    it('replaces keeping the formatting of the replaced text', () => {
        const state = createState(doc);
        const next = replaceEditorMatches(state, findInEditor(doc, 'cat', { wholeWord: true }), 'dog')!;
        expect(toEditorText(next.doc)).toBe('The dog sat. dog category\ndog = 1');
        const bold = next.doc.content![0]!.content!.find((n) => n.marks?.length);
        expect(bold).toMatchObject({ text: 'dog', marks: [{ type: 'bold' }] });
    });

    it('puts the caret after a single replacement', () => {
        const state = createState(doc);
        const [, second] = findInEditor(doc, 'cat');
        const next = replaceEditorMatches(state, [second!], 'kitten')!;
        expect(next.selection.head).toEqual({ path: [0], offset: 19 });
    });
});
