import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from './editor';
import { parseEditorHTML } from './html';
import { editorNodes as n, inlineLength } from './model';
import { editorDocFromJSON } from './json';
import { toEditorMarkdown, toEditorText } from './text';
import { createEditorView, type EditorView } from './view';

const at = (path: number[], offset: number) => ({ path, offset });

let view: EditorView | null = null;
afterEach(() => {
    view?.destroy();
    view = null;
    document.body.innerHTML = '';
});

describe('an inline chip', () => {
    const doc = n.doc(n.p('Ask ', n.chip('u42', 'Ana Souza', 'mention'), ' about it'));

    it('is one character of its block', () => {
        expect(inlineLength(doc.content![0]!.content)).toBe(4 + 1 + 9);
    });

    it('goes to HTML and back, keeping what it stands for', () => {
        const editor = createEditor({ content: doc });
        const html = editor.getHTML();
        expect(html).toBe('<p>Ask <span data-chip="u42" data-kind="mention" contenteditable="false">Ana Souza</span> about it</p>');
        expect(parseEditorHTML(html)).toEqual(doc);
    });

    it('goes to JSON and back, and reads as its label in text and Markdown', () => {
        const editor = createEditor({ content: doc });
        expect(editorDocFromJSON(editor.getJSON())).toEqual(doc);
        expect(toEditorText(doc)).toBe('Ask Ana Souza about it');
        expect(toEditorMarkdown(doc)).toBe('Ask Ana Souza about it');
    });

    it('is put in by insertChip with a space after it, and removed by one backspace', () => {
        const editor = createEditor({ content: n.doc(n.p('Hi ')) });
        editor.setSelection({ anchor: at([0], 3), head: at([0], 3) });
        expect(editor.run('insertChip', { id: 't1', label: 'urgent', kind: 'tag' })).toBe(true);
        expect(editor.getHTML()).toBe('<p>Hi <span data-chip="t1" data-kind="tag" contenteditable="false">urgent</span>&nbsp;</p>');
        expect(editor.state.selection.head).toEqual(at([0], 5));
        editor.setSelection({ anchor: at([0], 4), head: at([0], 4) });
        editor.backspace('char');
        // The chip goes; the spaces either side of it stay.
        expect(editor.getHTML()).toBe('<p>Hi &nbsp;</p>');
    });

    it('is drawn as a piece that cannot be edited, and counted as one when the caret moves around it', () => {
        const root = document.body.appendChild(document.createElement('div'));
        root.contentEditable = 'true';
        const editor = createEditor({ content: doc });
        view = createEditorView(root, editor, { chipClass: (kind) => `chip chip-${kind}` });
        const chip = root.querySelector<HTMLElement>('[data-chip]')!;
        expect(chip.getAttribute('contenteditable')).toBe('false');
        expect(chip.className).toBe('chip chip-mention');
        expect(chip.textContent).toBe('Ana Souza');
        const after = chip.nextSibling!;
        expect(view.posFromDOM(after, 0)).toEqual(at([0], 5));
        // A point inside the chip is read as just after it.
        expect(view.posFromDOM(chip.firstChild!, 3)).toEqual(at([0], 5));
        // Just before the chip is the end of the words before it.
        expect(view.domFromPos(at([0], 4))).toEqual({ node: chip.previousSibling, offset: 4 });
    });

    it('survives text typed around it and read back from the page', async () => {
        const root = document.body.appendChild(document.createElement('div'));
        root.contentEditable = 'true';
        const editor = createEditor({ content: doc });
        view = createEditorView(root, editor);
        const last = root.querySelector('p')!.lastChild as Text;
        last.data = ' about it!';
        root.dispatchEvent(new InputEvent('input', { inputType: 'insertText', bubbles: true }));
        expect(editor.getHTML()).toContain('<span data-chip="u42" data-kind="mention" contenteditable="false">Ana Souza</span> about it!');
    });
});
