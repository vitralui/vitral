import { describe, expect, it } from 'vitest';
import * as cmd from './commands';
import {
    addMarkInline,
    editorNodes as n,
    inlineLength,
    marksAt,
    markExtent,
    normalizeDoc,
    normalizeInline,
    rangeHasMark,
    removeMarkInline,
    sliceInline,
    type EditorNode,
    type EditorPosition
} from './model';
import { toEditorHTML } from './html';
import { createState, type EditorState } from './state';

const at = (path: number[], offset: number): EditorPosition => ({ path, offset });
function stateOf(doc: EditorNode, anchor: EditorPosition = at([0], 0), head: EditorPosition = anchor): EditorState {
    return { ...createState(doc), selection: { anchor, head } };
}
const html = (s: EditorState | null) => {
    expect(s, 'the command applies').not.toBeNull();
    return toEditorHTML(s!.doc);
};
const sel = (s: EditorState | null) => s && [s.selection.anchor, s.selection.head];

describe('editor model', () => {
    it('slices, measures and normalises inline content', () => {
        const content = [n.t('ab', n.bold()), n.br(), n.t('cd')];
        expect(inlineLength(content)).toBe(5);
        expect(sliceInline(content, 1, 4)).toEqual([n.t('b', n.bold()), n.br(), n.t('c')]);
        expect(normalizeInline([n.t('a', n.bold()), n.t(''), n.t('b', n.bold()), n.t('c')])).toEqual([n.t('ab', n.bold()), n.t('c')]);
    });

    it('adds, removes and queries marks over a range', () => {
        const content = [n.t('hello world')];
        const bolded = addMarkInline(content, 0, 5, n.bold());
        expect(bolded).toEqual([n.t('hello', n.bold()), n.t(' world')]);
        expect(rangeHasMark(bolded, 0, 5, 'bold')).toBe(true);
        expect(rangeHasMark(bolded, 0, 6, 'bold')).toBe(false);
        expect(removeMarkInline(bolded, 2, 4, 'bold')).toEqual([n.t('he', n.bold()), n.t('ll'), n.t('o', n.bold()), n.t(' world')]);
        // A colour replaces the colour already there.
        expect(addMarkInline([n.t('x', n.color('red'))], 0, 1, n.color('blue'))).toEqual([n.t('x', n.color('blue'))]);
    });

    it('carries marks to typed text, except a link past its end', () => {
        const content = [n.t('go', n.link('https://a.b'), n.bold()), n.t(' on')];
        expect(marksAt(content, 1).map((m) => m.type)).toEqual(['link', 'bold']);
        expect(marksAt(content, 2).map((m) => m.type)).toEqual(['bold']);
        expect(marksAt(content, 0).map((m) => m.type)).toEqual(['bold']);
        expect(markExtent(content, 2, 'link')).toMatchObject({ from: 0, to: 2 });
        expect(markExtent(content, 3, 'link')).toBeNull();
    });

    it('makes trees well formed: empty containers go, lists join, items start with text, trailing atoms get a paragraph', () => {
        const doc = normalizeDoc(n.doc(n.ul(n.li('a')), n.ul(n.li('b')), n.quote(), n.ol(n.li(n.ul(n.li('nested')))), n.hr()));
        expect(toEditorHTML(doc)).toBe('<ul><li><p>a</p></li><li><p>b</p></li></ul><ol><li><p>nested</p></li></ol><hr><p></p>');
        expect(normalizeDoc(n.doc()).content).toEqual([n.p()]);
        const table = normalizeDoc(n.doc(n.table(n.tr(n.td('a'), n.td('b')), n.tr(n.td('c')))));
        expect(table.content![0]!.content![1]!.content).toHaveLength(2);
    });

    it('keeps text blocks as the same objects through normalisation', () => {
        const para = n.p('x');
        const doc = normalizeDoc(n.doc(n.ul(n.li(para)), n.ul(n.li('y'))));
        expect(doc.content![0]!.content![0]!.content![0]).toBe(para);
    });
});

describe('editor commands: typing and deleting', () => {
    it('inserts text at the caret with the marks there, and replaces a selection', () => {
        const s = stateOf(n.doc(n.p(n.t('ab', n.bold()), 'cd')), at([0], 2));
        const typed = cmd.insertText(s, 'X');
        expect(html(typed)).toBe('<p><strong>abX</strong>cd</p>');
        expect(sel(typed)).toEqual([at([0], 3), at([0], 3)]);
        expect(html(cmd.insertText(stateOf(n.doc(n.p('hello')), at([0], 1), at([0], 4)), 'EY'))).toBe('<p>hEYo</p>');
    });

    it('uses stored marks, and turns newlines into hard breaks (but not in code)', () => {
        const s = { ...stateOf(n.doc(n.p('a')), at([0], 1)), storedMarks: [n.italic()] };
        expect(html(cmd.insertText(s, 'b\nc'))).toBe('<p>a<em>b<br>c</em></p>');
        expect(html(cmd.insertText(stateOf(n.doc(n.code('x')), at([0], 1)), '\ny'))).toBe('<pre><code>x\ny</code></pre>');
    });

    it('deletes by character (whole emoji), word and line', () => {
        const s = stateOf(n.doc(n.p('hi 👍🏽')), at([0], 7));
        expect(html(cmd.deleteBackward(s))).toBe('<p>hi&nbsp;</p>');
        const words = stateOf(n.doc(n.p('one two  three')), at([0], 14));
        expect(html(cmd.deleteBackward(words, 'word'))).toBe('<p>one two &nbsp;</p>');
        expect(html(cmd.deleteForward(stateOf(n.doc(n.p('one two')), at([0], 0)), 'word'))).toBe('<p>&nbsp;two</p>');
        expect(html(cmd.deleteBackward(stateOf(n.doc(n.p('a', n.br(), 'bc')), at([0], 4)), 'line'))).toBe('<p>a<br></p>');
        expect(html(cmd.deleteForward(stateOf(n.doc(n.p('abc')), at([0], 1))))).toBe('<p>ac</p>');
    });

    it('deletes a selection across blocks, joining the ends into the first block', () => {
        const s = stateOf(n.doc(n.h(1, 'Title'), n.p('middle'), n.p('end text')), at([0], 2), at([2], 4));
        const out = cmd.deleteSelection(s);
        expect(html(out)).toBe('<h1>Titext</h1>');
        expect(sel(out)).toEqual([at([0], 2), at([0], 2)]);
    });

    it('deletes across list items and quotes, removing what emptied', () => {
        const s = stateOf(n.doc(n.p('ab'), n.ul(n.li('one'), n.li('two')), n.quote(n.p('cd'))), at([0], 1), at([2, 0], 1));
        expect(html(cmd.deleteSelection(s))).toBe('<p>ad</p>');
        const partial = stateOf(n.doc(n.ul(n.li('one'), n.li('two'), n.li('three'))), at([0, 0, 0], 2), at([0, 1, 0], 1));
        expect(html(cmd.deleteSelection(partial))).toBe('<ul><li><p>onwo</p></li><li><p>three</p></li></ul>');
    });

    it('empties table cells a selection crosses, and removes tables it covers', () => {
        const table = n.table(n.tr(n.td('a1'), n.td('b1')), n.tr(n.td('a2'), n.td('b2')));
        const inside = stateOf(n.doc(table, n.p()), at([0, 0, 0, 0], 1), at([0, 1, 0, 0], 1));
        expect(html(cmd.deleteSelection(inside))).toBe('<table><tbody><tr><td><p>a</p></td><td><p></p></td></tr><tr><td><p>2</p></td><td><p>b2</p></td></tr></tbody></table><p></p>');
        const across = stateOf(n.doc(n.p('before'), table, n.p('after')), at([0], 3), at([2], 2));
        expect(html(cmd.deleteSelection(across))).toBe('<p>befter</p>');
    });

    it('joins backward: into the previous block, removing a rule, lifting items and quotes, and resetting headings', () => {
        expect(html(cmd.joinBackward(stateOf(n.doc(n.p('ab'), n.p('cd')), at([1], 0))))).toBe('<p>abcd</p>');
        expect(html(cmd.joinBackward(stateOf(n.doc(n.p('ab'), n.hr(), n.p('cd')), at([2], 0))))).toBe('<p>ab</p><p>cd</p>');
        expect(html(cmd.joinBackward(stateOf(n.doc(n.ul(n.li('a'), n.li('b'))), at([0, 1, 0], 0))))).toBe('<ul><li><p>a</p></li></ul><p>b</p>');
        expect(html(cmd.joinBackward(stateOf(n.doc(n.ul(n.li('a', n.ul(n.li('b'))))), at([0, 0, 1, 0, 0], 0))))).toBe('<ul><li><p>a</p></li><li><p>b</p></li></ul>');
        expect(html(cmd.joinBackward(stateOf(n.doc(n.p('x'), n.quote(n.p('q'))), at([1, 0], 0))))).toBe('<p>x</p><p>q</p>');
        expect(html(cmd.joinBackward(stateOf(n.doc(n.p('x'), n.h(2, 'T')), at([1], 0))))).toBe('<p>x</p><p>T</p>');
        expect(cmd.joinBackward(stateOf(n.doc(n.p('x')), at([0], 0)))).toBeNull();
        expect(cmd.joinBackward(stateOf(n.doc(n.p('x')), at([0], 1)))).toBeNull();
    });

    it('does not join across table cells', () => {
        const doc = n.doc(n.table(n.tr(n.td('a'), n.td('b'))));
        expect(cmd.joinBackward(stateOf(doc, at([0, 0, 1, 0], 0)))).toBeNull();
        expect(cmd.joinForward(stateOf(doc, at([0, 0, 0, 0], 1)))).toBeNull();
    });

    it('joins forward, pulling the next block (or its list item) in', () => {
        expect(html(cmd.joinForward(stateOf(n.doc(n.p('ab'), n.p('cd')), at([0], 2))))).toBe('<p>abcd</p>');
        expect(html(cmd.joinForward(stateOf(n.doc(n.p('ab'), n.ul(n.li('c'), n.li('d'))), at([0], 2))))).toBe('<p>abc</p><ul><li><p>d</p></li></ul>');
        expect(html(cmd.joinForward(stateOf(n.doc(n.p('ab'), n.img('/a.png', 'A'), n.p('c')), at([0], 2))))).toBe('<p>ab</p><p>c</p>');
    });

    it('deletes an image or rule by path', () => {
        const out = cmd.deleteNode(stateOf(n.doc(n.p('a'), n.img('/x.png', 'X'), n.p('b'))), [1]);
        expect(html(out)).toBe('<p>a</p><p>b</p>');
        expect(cmd.deleteNode(stateOf(n.doc(n.p('a'))), [0])).toBeNull();
    });
});

describe('editor commands: Enter', () => {
    it('splits a paragraph and keeps the marks for what is typed next', () => {
        const out = cmd.splitBlock(stateOf(n.doc(n.p(n.t('abcd', n.bold()))), at([0], 2)));
        expect(html(out)).toBe('<p><strong>ab</strong></p><p><strong>cd</strong></p>');
        expect(sel(out)).toEqual([at([1], 0), at([1], 0)]);
        expect(out!.storedMarks).toEqual([n.bold()]);
    });

    it('continues a heading as a paragraph at its end', () => {
        expect(html(cmd.splitBlock(stateOf(n.doc(n.h(2, 'Title')), at([0], 5))))).toBe('<h2>Title</h2><p></p>');
        expect(html(cmd.splitBlock(stateOf(n.doc(n.h(2, 'Title')), at([0], 0))))).toBe('<p></p><h2>Title</h2>');
    });

    it('splits list items, and leaves the list from an empty one', () => {
        const items = n.doc(n.ul(n.li('one', n.ul(n.li('sub')))));
        expect(html(cmd.splitBlock(stateOf(items, at([0, 0, 0], 1))))).toBe('<ul><li><p>o</p></li><li><p>ne</p><ul><li><p>sub</p></li></ul></li></ul>');
        const empty = stateOf(n.doc(n.ul(n.li('one'), n.li(n.p()))), at([0, 1, 0], 0));
        const out = cmd.splitBlock(empty);
        expect(html(out)).toBe('<ul><li><p>one</p></li></ul><p></p>');
        expect(sel(out)).toEqual([at([1], 0), at([1], 0)]);
        const tasks = cmd.splitBlock(stateOf(n.doc(n.tasks(n.task(true, 'done'))), at([0, 0, 0], 4)));
        expect(tasks!.doc.content![0]!.content!.map((i) => i.attrs?.checked)).toEqual([true, false]);
    });

    it('adds lines in a code block, and leaves it from an empty last line', () => {
        const code = cmd.splitBlock(stateOf(n.doc(n.code('let a')), at([0], 5)));
        expect(html(code)).toBe('<pre><code>let a\n</code></pre>');
        const exit = cmd.splitBlock(stateOf(n.doc(n.code('let a\n')), at([0], 6)));
        expect(html(exit)).toBe('<pre><code>let a</code></pre><p></p>');
    });

    it('leaves a quote from an empty last paragraph', () => {
        expect(html(cmd.splitBlock(stateOf(n.doc(n.quote(n.p('q'), n.p())), at([0, 1], 0))))).toBe('<blockquote><p>q</p></blockquote><p></p>');
    });

    it('inserts hard breaks', () => {
        expect(html(cmd.insertHardBreak(stateOf(n.doc(n.p('ab')), at([0], 1))))).toBe('<p>a<br>b</p>');
        expect(html(cmd.insertHardBreak(stateOf(n.doc(n.code('ab')), at([0], 1))))).toBe('<pre><code>a\nb</code></pre>');
    });
});

describe('editor commands: blocks and marks', () => {
    it('sets and toggles block types over every block selected', () => {
        const s = stateOf(n.doc(n.p('a'), n.p('b')), at([0], 0), at([1], 1));
        const headings = cmd.setBlockType(s, 'heading', { level: 2 });
        expect(html(headings)).toBe('<h2>a</h2><h2>b</h2>');
        expect(sel(headings)).toEqual([at([0], 0), at([1], 1)]);
        expect(html(cmd.toggleBlockType(headings!, 'heading', { level: 2 }))).toBe('<p>a</p><p>b</p>');
        expect(cmd.setBlockType(stateOf(n.doc(n.p('a'))), 'paragraph')).toBeNull();
    });

    it('turns text into code and back, line breaks and all', () => {
        const code = cmd.setBlockType(stateOf(n.doc(n.p(n.t('a', n.bold()), n.br(), 'b'))), 'codeBlock', { language: 'TS' });
        expect(html(code)).toBe('<pre><code class="language-ts">a\nb</code></pre>');
        expect(html(cmd.setBlockType(code!, 'paragraph'))).toBe('<p>a<br>b</p>');
        expect(html(cmd.setCodeBlockLanguage(code!, 'python'))).toBe('<pre><code class="language-python">a\nb</code></pre>');
        expect(html(cmd.setCodeBlockLanguage(code!, '"><script>'))).toBe('<pre><code>a\nb</code></pre>');
    });

    it('toggles a mark over a selection, and adds it when only part has it', () => {
        const s = stateOf(n.doc(n.p(n.t('ab', n.bold()), 'cd')), at([0], 0), at([0], 4));
        const all = cmd.toggleMark(s, 'bold');
        expect(html(all)).toBe('<p><strong>abcd</strong></p>');
        expect(html(cmd.toggleMark(all!, 'bold'))).toBe('<p>abcd</p>');
        const across = stateOf(n.doc(n.p('ab'), n.code('x'), n.p('cd')), at([0], 1), at([2], 1));
        expect(html(cmd.toggleMark(across, 'italic'))).toBe('<p>a<em>b</em></p><pre><code>x</code></pre><p><em>c</em>d</p>');
    });

    it('stores a toggled mark with nothing selected, and types with it', () => {
        const s = stateOf(n.doc(n.p('ab')), at([0], 2));
        const stored = cmd.toggleMark(s, 'bold')!;
        expect(stored.storedMarks).toEqual([n.bold()]);
        expect(stored.doc).toBe(s.doc);
        expect(html(cmd.insertText(stored, 'c'))).toBe('<p>ab<strong>c</strong></p>');
        expect(cmd.toggleMark(stored, 'bold')!.storedMarks).toEqual([]);
        expect(cmd.isActive(stored, 'bold')).toBe(true);
    });

    it('sets and clears colours and highlights', () => {
        const s = stateOf(n.doc(n.p('ab')), at([0], 0), at([0], 1));
        const red = cmd.setColor(s, 'red');
        expect(html(red)).toBe('<p><span data-color="red" style="color: var(--vt-editor-palette-red-color, #dc2626)">a</span>b</p>');
        expect(cmd.isActive(red!, 'color', { color: 'red' })).toBe(true);
        expect(cmd.isActive(red!, 'color', { color: 'blue' })).toBe(false);
        expect(cmd.activeMark(red!, 'color')?.attrs?.color).toBe('red');
        expect(html(cmd.setColor(red!, null))).toBe('<p>ab</p>');
        expect(html(cmd.setHighlight(s, 'yellow'))).toContain('<mark data-color="yellow"');
    });

    it('links a selection, edits the link at the caret, inserts one, and removes it', () => {
        const s = stateOf(n.doc(n.p('see docs')), at([0], 4), at([0], 8));
        const linked = cmd.setLink(s, 'https://example.com/docs');
        expect(html(linked)).toBe('<p>see <a href="https://example.com/docs" rel="noopener noreferrer nofollow">docs</a></p>');
        const inside = { ...linked!, selection: { anchor: at([0], 6), head: at([0], 6) } };
        expect(cmd.linkAt(inside)).toEqual({ href: 'https://example.com/docs', target: null, text: 'docs' });
        expect(html(cmd.setLink(inside, 'https://x.y', { target: '_blank' }))).toBe('<p>see <a href="https://x.y" target="_blank" rel="noopener noreferrer nofollow">docs</a></p>');
        expect(html(cmd.setLink(inside, 'https://x.y', { text: 'guide' }))).toBe('<p>see <a href="https://x.y" rel="noopener noreferrer nofollow">guide</a></p>');
        expect(html(cmd.unsetLink(inside))).toBe('<p>see docs</p>');
        const caret = stateOf(n.doc(n.p('go ')), at([0], 3));
        const inserted = cmd.setLink(caret, 'https://a.b', { text: 'here' });
        expect(html(inserted)).toBe('<p>go <a href="https://a.b" rel="noopener noreferrer nofollow">here</a></p>');
        expect(html(cmd.insertText(inserted!, '!'))).toBe('<p>go <a href="https://a.b" rel="noopener noreferrer nofollow">here</a>!</p>');
    });

    it('refuses unsafe link targets', () => {
        const s = stateOf(n.doc(n.p('x')), at([0], 0), at([0], 1));
        expect(cmd.setLink(s, 'javascript:alert(1)')).toBeNull();
        expect(cmd.setLink(s, ' JaVa\tScRiPt:alert(1)')).toBeNull();
        expect(cmd.setLink(s, 'data:text/html,<script>')).toBeNull();
        expect(cmd.unsetLink(s)).toBeNull();
    });

    it('clears formatting', () => {
        const s = stateOf(n.doc(n.h(1, n.t('ab', n.bold(), n.italic()))), at([0], 0), at([0], 2));
        expect(html(cmd.clearFormatting(s))).toBe('<p>ab</p>');
    });

    it('answers what is active', () => {
        const doc = n.doc(n.h(2, 'T'), n.ol(n.li('x')), n.quote(n.p('q')), n.table(n.tr(n.td('c'))));
        expect(cmd.isActive(stateOf(doc), 'heading')).toBe(true);
        expect(cmd.isActive(stateOf(doc), 'heading', { level: 2 })).toBe(true);
        expect(cmd.isActive(stateOf(doc), 'heading', { level: 1 })).toBe(false);
        expect(cmd.activeBlockType(stateOf(doc))).toBe('heading2');
        expect(cmd.isActive(stateOf(doc, at([1, 0, 0], 0)), 'orderedList')).toBe(true);
        expect(cmd.isActive(stateOf(doc, at([1, 0, 0], 0)), 'bulletList')).toBe(false);
        expect(cmd.isActive(stateOf(doc, at([2, 0], 0)), 'blockquote')).toBe(true);
        expect(cmd.isActive(stateOf(doc, at([3, 0, 0, 0], 0)), 'table')).toBe(true);
        expect(cmd.isActive(stateOf(doc), 'nonsense')).toBe(false);
    });
});

describe('editor commands: lists and quotes', () => {
    it('wraps paragraphs in a list, one item each', () => {
        const s = stateOf(n.doc(n.p('a'), n.p('b'), n.p('c')), at([0], 0), at([1], 1));
        const out = cmd.toggleList(s, 'bulletList');
        expect(html(out)).toBe('<ul><li><p>a</p></li><li><p>b</p></li></ul><p>c</p>');
        expect(sel(out)).toEqual([at([0, 0, 0], 0), at([0, 1, 0], 1)]);
    });

    it('unwraps the selected items when toggled again, splitting the list', () => {
        const s = stateOf(n.doc(n.ol(n.li('a'), n.li('b'), n.li('c'))), at([0, 1, 0], 0));
        expect(html(cmd.toggleList(s, 'orderedList'))).toBe('<ol><li><p>a</p></li></ol><p>b</p><ol start="3"><li><p>c</p></li></ol>');
    });

    it('converts a list to another kind', () => {
        const s = stateOf(n.doc(n.ul(n.li('a'), n.li('b'))), at([0, 0, 0], 0));
        expect(html(cmd.toggleList(s, 'orderedList'))).toBe('<ol><li><p>a</p></li><li><p>b</p></li></ol>');
        expect(html(cmd.toggleList(s, 'taskList'))).toBe(
            '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox" disabled></label><div><p>a</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox" disabled></label><div><p>b</p></div></li></ul>'
        );
    });

    it('indents an item under the one before it, and outdents it back', () => {
        const s = stateOf(n.doc(n.ul(n.li('a'), n.li('b'), n.li('c'))), at([0, 1, 0], 1));
        const sunk = cmd.sinkListItem(s);
        expect(html(sunk)).toBe('<ul><li><p>a</p><ul><li><p>b</p></li></ul></li><li><p>c</p></li></ul>');
        expect(sel(sunk)).toEqual([at([0, 0, 1, 0, 0], 1), at([0, 0, 1, 0, 0], 1)]);
        expect(html(cmd.liftListItem(sunk!))).toBe('<ul><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li></ul>');
        expect(cmd.sinkListItem(stateOf(n.doc(n.ul(n.li('a'))), at([0, 0, 0], 0)))).toBeNull();
    });

    it('keeps the items after an outdented one under it', () => {
        const s = stateOf(n.doc(n.ul(n.li('a', n.ul(n.li('b'), n.li('c'))))), at([0, 0, 1, 0, 0], 0));
        expect(html(cmd.liftListItem(s))).toBe('<ul><li><p>a</p></li><li><p>b</p><ul><li><p>c</p></li></ul></li></ul>');
    });

    it('joins a sunk item into the sub-list already there', () => {
        const s = stateOf(n.doc(n.ul(n.li('a', n.ul(n.li('a1'))), n.li('b'))), at([0, 1, 0], 0));
        expect(html(cmd.sinkListItem(s))).toBe('<ul><li><p>a</p><ul><li><p>a1</p></li><li><p>b</p></li></ul></li></ul>');
    });

    it('toggles task items', () => {
        const s = stateOf(n.doc(n.tasks(n.task(false, 'x'))), at([0, 0, 0], 0));
        const done = cmd.toggleTaskItem(s);
        expect(done!.doc.content![0]!.content![0]!.attrs?.checked).toBe(true);
        expect(cmd.toggleTaskItem(s, [0, 0])!.doc.content![0]!.content![0]!.attrs?.checked).toBe(true);
        expect(cmd.toggleTaskItem(stateOf(n.doc(n.p('x'))))).toBeNull();
    });

    it('wraps in a quote and unwraps', () => {
        const s = stateOf(n.doc(n.p('a'), n.p('b')), at([0], 0), at([1], 0));
        const quoted = cmd.toggleBlockquote(s);
        expect(html(quoted)).toBe('<blockquote><p>a</p><p>b</p></blockquote>');
        expect(html(cmd.toggleBlockquote(quoted!))).toBe('<p>a</p><p>b</p>');
    });

    it('indents and outdents code', () => {
        const s = stateOf(n.doc(n.code('a\nb')), at([0], 0), at([0], 3));
        const indented = cmd.indentCode(s);
        expect(html(indented)).toBe('<pre><code>  a\n  b</code></pre>');
        expect(sel(indented)).toEqual([at([0], 2), at([0], 7)]);
        expect(html(cmd.outdentCode(indented!))).toBe('<pre><code>a\nb</code></pre>');
        expect(html(cmd.indentCode(stateOf(n.doc(n.code('x')), at([0], 1))))).toBe('<pre><code>x  </code></pre>');
        expect(cmd.indentCode(stateOf(n.doc(n.p('x'))))).toBeNull();
    });
});

describe('editor commands: inserting', () => {
    it('inserts a rule or an image, splitting the block, with the caret after', () => {
        const out = cmd.insertHorizontalRule(stateOf(n.doc(n.p('abcd')), at([0], 2)));
        expect(html(out)).toBe('<p>ab</p><hr><p>cd</p>');
        expect(sel(out)).toEqual([at([2], 0), at([2], 0)]);
        expect(html(cmd.insertHorizontalRule(stateOf(n.doc(n.p()))))).toBe('<hr><p></p>');
        expect(html(cmd.insertImage(stateOf(n.doc(n.p('x')), at([0], 1)), { src: 'https://a.b/c.png', alt: 'A cat' }))).toBe('<p>x</p><img src="https://a.b/c.png" alt="A cat"><p></p>');
        expect(cmd.insertImage(stateOf(n.doc(n.p())), { src: 'javascript:alert(1)', alt: 'x' })).toBeNull();
        expect(cmd.insertHorizontalRule(stateOf(n.doc(n.code('x'))))).toBeNull();
    });

    it('inserts a table and moves between its cells, adding a row at the end', () => {
        const table = cmd.insertTable(stateOf(n.doc(n.p())), 2, 2);
        expect(html(table)).toBe('<table><tbody><tr><th><p></p></th><th><p></p></th></tr><tr><td><p></p></td><td><p></p></td></tr></tbody></table><p></p>');
        expect(sel(table)![0]).toEqual(at([0, 0, 0, 0], 0));
        let s = table!;
        for (let i = 0; i < 3; i++) s = cmd.goToCell(s, 1)!;
        expect(s.selection.head.path).toEqual([0, 1, 1, 0]);
        s = cmd.goToCell(s, 1)!;
        expect(s.doc.content![0]!.content).toHaveLength(3);
        expect(s.selection.head.path).toEqual([0, 2, 0, 0]);
        expect(cmd.goToCell(s, -1)!.selection.head.path).toEqual([0, 1, 1, 0]);
    });

    it('adds and removes rows and columns', () => {
        const base = stateOf(n.doc(n.table(n.tr(n.th('h1'), n.th('h2')), n.tr(n.td('a'), n.td('b')))), at([0, 1, 0, 0], 0));
        const cols = cmd.addColumn(base, true)!;
        expect(cols.doc.content![0]!.content!.map((r) => r.content!.map((c) => c.type))).toEqual([
            ['tableHeader', 'tableHeader', 'tableHeader'],
            ['tableCell', 'tableCell', 'tableCell']
        ]);
        expect(cols.selection.head.path).toEqual([0, 1, 1, 0]);
        expect(cmd.addRow(base, false)!.doc.content![0]!.content).toHaveLength(3);
        expect(html(cmd.deleteRow(base))).toBe('<table><tbody><tr><th><p>h1</p></th><th><p>h2</p></th></tr></tbody></table><p></p>');
        expect(html(cmd.deleteColumn(base))).toBe('<table><tbody><tr><th><p>h2</p></th></tr><tr><td><p>b</p></td></tr></tbody></table><p></p>');
        expect(html(cmd.deleteTable(base))).toBe('');
        expect(cmd.addRow(stateOf(n.doc(n.p())))).toBeNull();
    });

    it('pastes inline content into the block', () => {
        const s = stateOf(n.doc(n.h(1, 'Hello')), at([0], 5));
        const out = cmd.insertContent(s, [n.p(' big ', n.t('world', n.bold()))]);
        expect(html(out)).toBe('<h1>Hello big <strong>world</strong></h1>');
        expect(sel(out)).toEqual([at([0], 15), at([0], 15)]);
    });

    it('pastes blocks by splitting the block, joining the first and last to its halves', () => {
        const s = stateOf(n.doc(n.p('abcd')), at([0], 2));
        const out = cmd.insertContent(s, [n.p('X'), n.ul(n.li('i')), n.p('Y')]);
        expect(html(out)).toBe('<p>abX</p><ul><li><p>i</p></li></ul><p>Ycd</p>');
        expect(sel(out)).toEqual([at([2], 1), at([2], 1)]);
    });

    it('pastes a list into an empty paragraph without leaving an empty one behind', () => {
        const out = cmd.insertContent(stateOf(n.doc(n.p())), [n.ul(n.li('a'), n.li('b'))]);
        expect(html(out)).toBe('<ul><li><p>a</p></li><li><p>b</p></li></ul>');
        expect(sel(out)).toEqual([at([0, 1, 0], 1), at([0, 1, 0], 1)]);
    });

    it('pastes into a code block as text', () => {
        const out = cmd.insertContent(stateOf(n.doc(n.code('x')), at([0], 1)), [n.p(n.t('a', n.bold())), n.p('b')]);
        expect(html(out)).toBe('<pre><code>xa\nb</code></pre>');
    });

    it('selects everything', () => {
        const all = cmd.selectAll(stateOf(n.doc(n.p('ab'), n.ul(n.li('cd')))));
        expect(sel(all)).toEqual([at([0], 0), at([1, 0, 0], 2)]);
    });
});

describe('text units', () => {
    it('steps over graphemes and words', () => {
        expect(cmd.previousCharOffset('a👨‍👩‍👧', 9)).toBe(1);
        expect(cmd.nextCharOffset(`e${String.fromCharCode(0x301, 0x303)}x`, 0)).toBe(3);
        expect(cmd.previousWordOffset('foo bar, baz', 12)).toBe(9);
        expect(cmd.previousWordOffset('foo bar,', 8)).toBe(7);
        expect(cmd.nextWordOffset('foo bar', 3)).toBe(7);
    });
});
