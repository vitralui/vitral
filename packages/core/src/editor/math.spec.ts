import { afterEach, describe, expect, it } from 'vitest';
import { isMathLoaded, loadMath } from '../math';
import { formulasIn, mathAt } from './commands';
import { createEditor } from './editor';
import { parseEditorHTML } from './html';
import { editorDocFromJSON } from './json';
import { editorNodes as n, inlineLength } from './model';
import { toEditorMarkdown, toEditorText } from './text';
import { createEditorView, type EditorView } from './view';

const at = (path: number[], offset: number) => ({ path, offset });

let view: EditorView | null = null;
afterEach(() => {
    view?.destroy();
    view = null;
    document.body.innerHTML = '';
});

describe('a formula in the text', () => {
    const doc = n.doc(n.p('Area: ', n.math('\\frac{b h}{2}'), ' for any triangle'));

    it('is its source until the renderer has been loaded, in the HTML and on the page', async () => {
        expect(isMathLoaded()).toBe(false);
        const editor = createEditor({ content: doc });
        expect(editor.getHTML()).toBe('<p>Area: <span data-math="\\frac{b h}{2}" contenteditable="false">\\frac{b h}{2}</span> for any triangle</p>');
        const before = editor.state.doc;
        const root = document.body.appendChild(document.createElement('div'));
        view = createEditorView(root, editor, { mathClass: ({ pending }) => (pending ? 'math pending' : 'math') });
        const formula = root.querySelector<HTMLElement>('[data-math]')!;
        expect(formula.textContent).toBe('\\frac{b h}{2}');
        expect(formula.className).toBe('math pending');
        // Showing a formula is what asks for the renderer: when it comes, the formula is drawn where it stands.
        await loadMath();
        await Promise.resolve();
        expect(root.querySelector('[data-math]')).toBe(formula);
        expect(formula.firstElementChild?.localName).toBe('svg');
        expect(formula.className).toBe('math');
        // Drawing it was not an edit.
        expect(editor.state.doc).toBe(before);
        expect(editor.can('undo')).toBe(false);
    });

    it('is one character of its block', () => {
        expect(inlineLength(doc.content![0]!.content)).toBe(6 + 1 + 17);
    });

    it('goes to HTML as its drawing around its source, and back from the source alone', async () => {
        await loadMath();
        const editor = createEditor({ content: doc });
        const html = editor.getHTML();
        expect(html).toMatch(/^<p>Area: <span data-math="\\frac\{b h\}\{2\}" contenteditable="false"><svg style="vertical-align:-[\d.]+em" xmlns=/);
        expect(html).not.toContain('data-at');
        expect(parseEditorHTML(html)).toEqual(doc);
        // What the drawing is does not matter to the reading: a stale or a missing one reads the same.
        expect(parseEditorHTML('<p>Area: <span data-math="\\frac{b h}{2}">anything</span> for any triangle</p>')).toEqual(doc);
        expect(parseEditorHTML('<p><span data-math="x^2" data-display="true"></span></p>')).toEqual(n.doc(n.p(n.math('x^2', true))));
        // A formula with no source is nothing.
        expect(parseEditorHTML('<p>a<span data-math=" "></span>b</p>')).toEqual(n.doc(n.p('ab')));
    });

    it('escapes its source, which is text and never markup', async () => {
        await loadMath();
        const editor = createEditor({ content: n.doc(n.p(n.math('a < b & "c"'))) });
        const html = editor.getHTML();
        expect(html).toContain('data-math="a &lt; b &amp; &quot;c&quot;"');
        expect(html).not.toContain('<b');
        expect(parseEditorHTML(html)).toEqual(n.doc(n.p(n.math('a < b & "c"'))));
    });

    it('goes to JSON and back, and reads as its source in text and Markdown', () => {
        const editor = createEditor({ content: doc });
        expect(editor.getJSON().content![0]!.content![1]).toEqual({ type: 'math', attrs: { latex: '\\frac{b h}{2}', display: false } });
        expect(editorDocFromJSON(editor.getJSON())).toEqual(doc);
        expect(editorDocFromJSON({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'math', attrs: { latex: 7 } }, { type: 'math', attrs: { latex: '  ' } }] }] })).toEqual(n.doc(n.p()));
        expect(toEditorText(doc)).toBe('Area: \\frac{b h}{2} for any triangle');
        expect(toEditorMarkdown(doc)).toBe('Area: $\\frac{b h}{2}$ for any triangle');
        expect(toEditorMarkdown(n.doc(n.p(n.math('x', true))))).toBe('$$x$$');
        // Like a chip, it is not counted against a limit on the text.
        expect(editor.characterCount()).toBe(6 + 17);
    });

    it('is put in by insertMath, found by the selection, changed by setMath and removed by one backspace', () => {
        const editor = createEditor({ content: n.doc(n.p('E = ')) });
        editor.setSelection({ anchor: at([0], 4), head: at([0], 4) });
        expect(editor.run('insertMath', { latex: '  ' })).toBe(false);
        expect(editor.run('insertMath', { latex: 'mc^2' })).toBe(true);
        expect(editor.getJSON().content![0]!.content![1]).toEqual({ type: 'math', attrs: { latex: 'mc^2', display: false } });
        expect(editor.state.selection.head).toEqual(at([0], 5));
        // The caret is right after it, which is being on it.
        expect(editor.isActive('math')).toBe(true);
        expect(mathAt(editor.state)).toEqual({ path: [0], offset: 4, latex: 'mc^2', display: false });
        editor.setSelection({ anchor: at([0], 4), head: at([0], 5) });
        expect(mathAt(editor.state)?.offset).toBe(4);
        editor.setSelection({ anchor: at([0], 2), head: at([0], 2) });
        expect(editor.isActive('math')).toBe(false);

        expect(editor.run('setMath', at([0], 4), { latex: 'mc^{2}', display: true })).toBe(true);
        expect(editor.getJSON().content![0]!.content![1]!.attrs).toEqual({ latex: 'mc^{2}', display: true });
        expect(editor.state.selection.head).toEqual(at([0], 5));
        // Not a formula there: nothing to change.
        expect(editor.run('setMath', at([0], 1), { latex: 'x' })).toBe(false);
        // One undo for one change.
        editor.undo();
        expect(editor.getJSON().content![0]!.content![1]!.attrs).toEqual({ latex: 'mc^2', display: false });

        editor.setSelection({ anchor: at([0], 5), head: at([0], 5) });
        editor.backspace('char');
        expect(editor.getText()).toBe('E = ');
        editor.undo();
        // Left with no source, a formula is taken out.
        expect(editor.run('setMath', at([0], 4), { latex: '' })).toBe(true);
        expect(editor.getText()).toBe('E = ');
    });

    it('is not put in a code block', () => {
        const editor = createEditor({ content: n.doc(n.code('x')) });
        expect(editor.can('insertMath', { latex: 'x' })).toBe(false);
    });

    it('is drawn as a piece that cannot be edited, each part naming its place in the source', async () => {
        await loadMath();
        const root = document.body.appendChild(document.createElement('div'));
        root.contentEditable = 'true';
        const editor = createEditor({ content: doc });
        view = createEditorView(root, editor);
        const formula = root.querySelector<HTMLElement>('[data-math]')!;
        expect(formula.getAttribute('contenteditable')).toBe('false');
        const svg = formula.querySelector('svg')!;
        expect(svg.getAttribute('role')).toBe('img');
        expect(svg.getAttribute('aria-label')).toBe('\\frac{b h}{2}');
        expect(svg.style.verticalAlign).toMatch(/^-[\d.]+em$/);
        expect(svg.hasAttribute('style')).toBe(true);
        const two = formula.querySelector('[data-at="11,12"]')!;
        expect(two.hasAttribute('data-leaf')).toBe(true);
        // One character: the caret is before it or after it, never in it.
        expect(view.posFromDOM(formula.nextSibling!, 0)).toEqual(at([0], 7));
        expect(view.posFromDOM(two, 0)).toEqual(at([0], 7));
        expect(view.domFromPos(at([0], 6))).toEqual({ node: formula.previousSibling, offset: 6 });
    });

    it('survives text typed around it and read back from the page', async () => {
        await loadMath();
        const root = document.body.appendChild(document.createElement('div'));
        root.contentEditable = 'true';
        const editor = createEditor({ content: doc });
        view = createEditorView(root, editor);
        const last = root.querySelector('p')!.lastChild as Text;
        last.data = ' for any triangle!';
        root.dispatchEvent(new InputEvent('input', { inputType: 'insertText', bubbles: true }));
        expect(editor.getJSON()).toEqual(n.doc(n.p('Area: ', n.math('\\frac{b h}{2}'), ' for any triangle!')));
    });

    it('writes its HTML with the drawings or with the source alone, and reads either back the same', async () => {
        await loadMath();
        const editor = createEditor({ content: doc });
        const drawing = editor.getHTML();
        const source = editor.getHTML({ math: 'source' });
        expect(source).toBe('<p>Area: <span data-math="\\frac{b h}{2}" contenteditable="false">\\frac{b h}{2}</span> for any triangle</p>');
        expect(drawing).toContain('<svg');
        expect(parseEditorHTML(source)).toEqual(parseEditorHTML(drawing));
        // The editor's own setting is what a call that says nothing gets.
        editor.mathOutput = 'source';
        expect(editor.getHTML()).toBe(source);
        expect(editor.getHTML({ math: 'drawing' })).toBe(drawing);
        expect(createEditor({ content: doc, mathOutput: 'source' }).getHTML()).toBe(source);
    });

    it('lists the formulas of a document, in order, with where each is', () => {
        const many = n.doc(n.p('a ', n.math('x^2'), ' b ', n.math('\\sum_{i=1}^{n} i', true)), n.ul(n.li(n.p(n.math('\\pi')))));
        expect(formulasIn(many)).toEqual([
            { path: [0], offset: 2, latex: 'x^2', display: false },
            { path: [0], offset: 6, latex: '\\sum_{i=1}^{n} i', display: true },
            { path: [1, 0, 0], offset: 0, latex: '\\pi', display: false }
        ]);
        expect(formulasIn(n.doc(n.p('none')))).toEqual([]);
    });
});
