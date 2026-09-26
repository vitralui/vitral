import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditor, type EditorInstance } from './editor';
import { editorNodes as n, type EditorNode } from './model';
import { createEditorView, editorLinkHint, type EditorView, type EditorViewOptions } from './view';

const at = (path: number[], offset: number) => ({ path, offset });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

let view: EditorView | null = null;
afterEach(() => {
    view?.destroy();
    view = null;
    document.body.innerHTML = '';
});

function setup(content: string | EditorNode, options: EditorViewOptions = {}, maxLength?: number): { editor: EditorInstance; view: EditorView; root: HTMLElement } {
    const root = document.createElement('div');
    root.contentEditable = 'true';
    root.tabIndex = 0;
    document.body.appendChild(root);
    const editor = createEditor({ content, maxLength });
    view = createEditorView(root, editor, { taskLabel: 'Done', selectedClass: 'selected', emptyClass: 'empty', ...options });
    root.focus();
    return { editor, view, root };
}

function select(node: Node, offset: number, focusNode = node, focusOffset = offset) {
    document.getSelection()!.setBaseAndExtent(node, offset, focusNode, focusOffset);
}

function input(root: HTMLElement, inputType: string, data: string | null = null): InputEvent {
    const event = new InputEvent('beforeinput', { inputType, data, bubbles: true, cancelable: true });
    root.dispatchEvent(event);
    return event;
}

function key(root: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    root.dispatchEvent(event);
    return event;
}

const caretOffset = () => {
    const sel = document.getSelection()!;
    return { node: sel.focusNode, offset: sel.focusOffset };
};

describe('createEditorView: drawing', () => {
    it('draws the document as semantic HTML, with fillers where a caret needs a line', () => {
        const { root } = setup(n.doc(n.h(1, 'T'), n.p('a ', n.t('b', n.bold(), n.link('https://x.y'))), n.p(), n.p('x', n.br()), n.code('let\n', 'js')));
        expect(root.innerHTML).toBe(
            '<h1>T</h1><p>a <a href="https://x.y" rel="noopener noreferrer nofollow"><strong>b</strong></a></p><p><br data-vt-filler=""></p><p>x<br><br data-vt-filler=""></p>' +
                '<pre data-language="js"><code class="language-js">let\n<br data-vt-filler=""></code></pre>'
        );
    });

    it('draws task items with a named checkbox, and images and rules as uneditable blocks', () => {
        const { root } = setup(n.doc(n.tasks(n.task(true, 'done')), n.img('https://a.b/c.png', 'Cat'), n.hr(), n.p()));
        const box = root.querySelector('input')!;
        expect(box.checked).toBe(true);
        expect(box.getAttribute('aria-label')).toBe('Done');
        expect(box.tabIndex).toBe(-1);
        expect(box.closest('label')!.getAttribute('contenteditable')).toBe('false');
        expect(root.querySelector('[data-type="image"]')!.getAttribute('contenteditable')).toBe('false');
        expect(root.querySelector('img')!.getAttribute('alt')).toBe('Cat');
        expect(root.querySelector('[data-type="horizontalRule"] hr')).not.toBeNull();
    });

    it('marks an empty document for the placeholder', () => {
        const { root, editor } = setup('');
        expect(root.classList.contains('empty')).toBe(true);
        editor.typeText('a');
        expect(root.classList.contains('empty')).toBe(false);
    });

    it('keeps the elements of blocks that did not change', () => {
        const { root, editor } = setup('<p>one</p><ul><li><p>two</p></li></ul><p>three</p>');
        const [first, list, third] = Array.from(root.children);
        const item = list!.querySelector('li');
        editor.setSelection({ anchor: at([2], 5), head: at([2], 5) });
        editor.typeText('!');
        expect(root.children[0]).toBe(first);
        expect(root.children[1]).toBe(list);
        expect(root.querySelector('li')).toBe(item);
        expect(root.children[2]).not.toBe(third);
        expect(root.children[2]!.textContent).toBe('three!');
        editor.undo();
        expect(root.children[2]).toBe(third);
    });

    it('never puts unsafe URLs in the DOM', () => {
        const { root } = setup({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] } as EditorNode);
        expect(root.innerHTML).toBe('<p>x</p>');
    });
});

describe('createEditorView: positions', () => {
    it('maps DOM points to document positions and back', () => {
        const { root, view } = setup(n.doc(n.p('ab', n.t('cd', n.bold()), n.br(), 'ef'), n.ul(n.li('item'))));
        const p = root.querySelector('p')!;
        const strongText = p.querySelector('strong')!.firstChild!;
        expect(view.posFromDOM(p.firstChild!, 1)).toEqual(at([0], 1));
        expect(view.posFromDOM(strongText, 2)).toEqual(at([0], 4));
        expect(view.posFromDOM(p, 3)).toEqual(at([0], 5));
        expect(view.posFromDOM(p.lastChild!, 2)).toEqual(at([0], 7));
        const itemText = root.querySelector('li p')!.firstChild!;
        expect(view.posFromDOM(itemText, 3)).toEqual(at([1, 0, 0], 3));
        expect(view.domFromPos(at([0], 3))).toEqual({ node: strongText, offset: 1 });
        expect(view.domFromPos(at([0], 4))).toEqual({ node: strongText, offset: 2 });
        expect(view.domFromPos(at([0], 5))).toEqual({ node: p.lastChild, offset: 0 });
        expect(view.domFromPos(at([1, 0, 0], 4))).toEqual({ node: itemText, offset: 4 });
        expect(view.posFromDOM(document.body, 0)).toBeNull();
    });

    it('maps points between blocks and in empty ones onto the nearest text block', () => {
        const { root, view } = setup(n.doc(n.p('a'), n.hr(), n.p()));
        expect(view.posFromDOM(root, 1)).toEqual(at([2], 0));
        expect(view.posFromDOM(root, 3)).toEqual(at([2], 0));
        const empty = root.lastElementChild!;
        expect(view.posFromDOM(empty, 1)).toEqual(at([2], 0));
        expect(view.domFromPos(at([2], 0))).toEqual({ node: empty, offset: 0 });
    });

    it('reads the DOM selection into the editor and writes the editor’s back', () => {
        const { root, editor } = setup('<p>hello</p><p>world</p>');
        select(root.firstElementChild!.firstChild!, 1, root.lastElementChild!.firstChild!, 2);
        view!.readSelection();
        expect(editor.state.selection).toEqual({ anchor: at([0], 1), head: at([1], 2) });
        editor.setSelection({ anchor: at([1], 4), head: at([1], 4) });
        expect(caretOffset()).toEqual({ node: root.lastElementChild!.firstChild, offset: 4 });
    });
});

describe('createEditorView: input', () => {
    it('types through beforeinput, cancelling the browser’s own change', () => {
        const { root, editor } = setup('<p>hllo</p>');
        select(root.querySelector('p')!.firstChild!, 1);
        const event = input(root, 'insertText', 'e');
        expect(event.defaultPrevented).toBe(true);
        expect(editor.getHTML()).toBe('<p>hello</p>');
        expect(root.innerHTML).toBe('<p>hello</p>');
        expect(caretOffset()).toEqual({ node: root.querySelector('p')!.firstChild, offset: 2 });
    });

    it('replaces the selection, splits on Enter and deletes backward and forward', () => {
        const { root, editor } = setup('<p>abcdef</p>');
        const text = () => root.querySelector('p')!.firstChild!;
        select(text(), 1, text(), 3);
        input(root, 'insertText', 'X');
        expect(editor.getHTML()).toBe('<p>aXdef</p>');
        expect(key(root, 'Enter').defaultPrevented).toBe(true);
        expect(editor.getHTML()).toBe('<p>aX</p><p>def</p>');
        input(root, 'deleteContentBackward');
        expect(editor.getHTML()).toBe('<p>aXdef</p>');
        input(root, 'deleteContentForward');
        expect(editor.getHTML()).toBe('<p>aXef</p>');
        input(root, 'insertParagraph');
        input(root, 'insertLineBreak');
        expect(editor.getHTML()).toBe('<p>aX</p><p><br>ef</p>');
        input(root, 'historyUndo');
        expect(editor.getHTML()).toBe('<p>aX</p><p>ef</p>');
        input(root, 'historyRedo');
        expect(editor.getHTML()).toBe('<p>aX</p><p><br>ef</p>');
    });

    it('turns Markdown typed character by character into structure', () => {
        const { root, editor } = setup('');
        for (const ch of '- item') input(root, 'insertText', ch);
        expect(editor.getHTML()).toBe('<ul><li><p>item</p></li></ul>');
        expect(root.querySelector('ul li p')!.textContent).toBe('item');
    });

    it('runs keyboard shortcuts, and lets Tab out when it means nothing', () => {
        const { root, editor } = setup('<ul><li><p>a</p></li><li><p>b</p></li></ul><p>c</p>');
        const b = root.querySelectorAll('li p')[1]!.firstChild!;
        select(b, 0, b, 1);
        expect(key(root, 'b', { ctrlKey: true }).defaultPrevented).toBe(true);
        expect(editor.isActive('bold')).toBe(true);
        expect(key(root, 'Tab').defaultPrevented).toBe(true);
        expect(editor.getHTML()).toBe('<ul><li><p>a</p><ul><li><p><strong>b</strong></p></li></ul></li></ul><p>c</p>');
        expect(key(root, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
        select(root.lastElementChild!.firstChild!, 0);
        expect(key(root, 'Tab').defaultPrevented).toBe(false);
        expect(key(root, 'z', { ctrlKey: true }).defaultPrevented).toBe(true);
        expect(editor.getHTML()).toBe('<ul><li><p>a</p><ul><li><p><strong>b</strong></p></li></ul></li></ul><p>c</p>');
        expect(key(root, 'z', { ctrlKey: true }).defaultPrevented).toBe(true);
        expect(editor.getHTML()).toBe('<ul><li><p>a</p></li><li><p><strong>b</strong></p></li></ul><p>c</p>');
        expect(key(root, 'a', { ctrlKey: true }).defaultPrevented).toBe(false);
    });

    it('offers keys to the interface first', () => {
        const seen: string[] = [];
        const { root, editor } = setup('<p>x</p>', { handleKey: (name, binding) => (seen.push(`${name}:${binding?.[0] ?? ''}`), name === 'Mod-k') });
        expect(key(root, 'k', { ctrlKey: true }).defaultPrevented).toBe(true);
        key(root, 'F10', { altKey: true });
        key(root, 'Escape');
        expect(seen).toEqual(['Mod-k:link', 'Alt-F10:toolbar', 'Escape:']);
        expect(editor.getHTML()).toBe('<p>x</p>');
    });

    it('formats through the browser’s own format inputs', () => {
        const { root, editor } = setup('<p>ab</p>');
        const text = root.querySelector('p')!.firstChild!;
        select(text, 0, text, 2);
        input(root, 'formatItalic');
        input(root, 'formatBold');
        expect(editor.getHTML()).toBe('<p><strong><em>ab</em></strong></p>');
        input(root, 'formatRemove');
        expect(editor.getHTML()).toBe('<p>ab</p>');
        input(root, 'somethingUnknown');
        expect(editor.getHTML()).toBe('<p>ab</p>');
    });

    it('sanitises pasted HTML and pastes plain text as paragraphs', () => {
        const { root, editor } = setup('<p>ab</p>');
        select(root.querySelector('p')!.firstChild!, 1);
        const paste = (data: Record<string, string>) => {
            const event = new Event('paste', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'clipboardData', { value: { getData: (type: string) => data[type] ?? '' } });
            root.dispatchEvent(event);
            return event;
        };
        expect(paste({ 'text/html': '<b onclick="x()">X</b><script>alert(1)</script>', 'text/plain': 'X' }).defaultPrevented).toBe(true);
        expect(editor.getHTML()).toBe('<p>a<strong>X</strong>b</p>');
        paste({ 'text/plain': 'one\ntwo' });
        expect(editor.getHTML()).toBe('<p>a<strong>X</strong>one</p><p>twob</p>');
        expect(root.innerHTML).not.toContain('script');
    });

    it('pastes only as much as fits under the limit', () => {
        const { root, editor } = setup('<p>ab</p>', {}, 5);
        select(root.querySelector('p')!.firstChild!, 2);
        const event = new Event('paste', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'clipboardData', { value: { getData: (type: string) => (type === 'text/plain' ? 'cdefgh' : '') } });
        root.dispatchEvent(event);
        expect(editor.getText()).toBe('abcde');
    });

    it('follows a link on Ctrl+click or Alt+Enter, and says so over it', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const { root, editor } = setup(n.doc(n.p('see ', n.t('docs', n.link('https://example.com/docs')))), {
            linkHint: (href) => ({ text: editorLinkHint(href, '{key}+click to open', false) })
        });
        const a = root.querySelector('a')!;
        // A plain click is the caret's; Shift+click extends the selection.
        a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }));
        expect(open).not.toHaveBeenCalled();
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
        a.dispatchEvent(click);
        expect(click.defaultPrevented).toBe(true);
        expect(open).toHaveBeenLastCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer');
        // From the keyboard, with the caret in the link; outside one, the key is left alone.
        editor.setSelection({ anchor: at([0], 6), head: at([0], 6) });
        expect(key(root, 'Enter', { altKey: true }).defaultPrevented).toBe(true);
        expect(open).toHaveBeenCalledTimes(2);
        editor.setSelection({ anchor: at([0], 1), head: at([0], 1) });
        expect(key(root, 'Enter', { altKey: true }).defaultPrevented).toBe(false);
        // The tooltip, over the link while the pointer is.
        a.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        await tick();
        expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('example.com/docs — Ctrl+click to open');
        root.dispatchEvent(new MouseEvent('mouseleave'));
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
        open.mockRestore();
    });

    it('refuses every change when not editable', () => {
        const { root, editor } = setup('<p>ab</p>', { editable: () => false });
        select(root.querySelector('p')!.firstChild!, 1);
        expect(input(root, 'insertText', 'x').defaultPrevented).toBe(true);
        key(root, 'Enter');
        key(root, 'b', { ctrlKey: true });
        expect(editor.getHTML()).toBe('<p>ab</p>');
        expect(root.querySelector('p')!.textContent).toBe('ab');
    });

    it('toggles a task by its checkbox', async () => {
        const { root, editor } = setup('<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>x</p></li><li data-type="taskItem"><p>y</p><ul><li><p>sub</p></li></ul></li></ul>');
        const boxes = () => root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        boxes()[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(editor.getJSON().content![0]!.content![1]!.attrs?.checked).toBe(true);
        expect(boxes()[1]!.checked).toBe(true);
        boxes()[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        expect(editor.getJSON().content![0]!.content![0]!.attrs?.checked).toBe(true);
    });

    it('selects an image on a press, and deletes it with Backspace', () => {
        const { root, editor } = setup('<p>a</p><img src="https://a.b/c.png" alt="c"><p>b</p>');
        const figure = root.querySelector('[data-type="image"]')!;
        figure.querySelector('img')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        expect(figure.classList.contains('selected')).toBe(true);
        expect(figure.hasAttribute('data-selected')).toBe(true);
        expect(key(root, 'Backspace').defaultPrevented).toBe(true);
        expect(editor.getHTML()).toBe('<p>a</p><p>b</p>');
    });
});

describe('createEditorView: reading the DOM back', () => {
    it('lets a composition run and reads its result when it ends', async () => {
        const { root, editor } = setup('<p>ab</p>');
        const text = root.querySelector('p')!.firstChild as Text;
        select(text, 1);
        root.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        const during = new InputEvent('beforeinput', { inputType: 'insertCompositionText', data: 'に', bubbles: true, cancelable: false, isComposing: true });
        root.dispatchEvent(during);
        text.insertData(1, 'に');
        select(text, 2);
        root.dispatchEvent(new InputEvent('input', { inputType: 'insertCompositionText', data: 'に', bubbles: true, isComposing: true }));
        expect(editor.getHTML()).toBe('<p>ab</p>');
        root.dispatchEvent(new CompositionEvent('compositionend', { data: 'に', bubbles: true }));
        await tick();
        expect(editor.getHTML()).toBe('<p>aにb</p>');
        expect(editor.state.selection.head).toEqual(at([0], 2));
        editor.undo();
        expect(root.querySelector('p')!.textContent).toBe('ab');
    });

    it('reads text a browser changed without a cancellable beforeinput', async () => {
        const { root, editor } = setup('<p><strong>teh</strong> end</p>');
        const text = root.querySelector('strong')!.firstChild as Text;
        text.data = 'the';
        root.dispatchEvent(new InputEvent('input', { inputType: 'insertReplacementText', bubbles: true }));
        expect(editor.getHTML()).toBe('<p><strong>the</strong> end</p>');
    });

    it('rereads everything when the browser reshaped the blocks', () => {
        const { root, editor } = setup('<p>one</p>');
        const div = document.createElement('div');
        div.textContent = 'two';
        root.appendChild(div);
        root.dispatchEvent(new InputEvent('input', { inputType: 'insertParagraph', bubbles: true }));
        expect(editor.getHTML()).toBe('<p>one</p><p>two</p>');
        expect(root.innerHTML).toBe('<p>one</p><p>two</p>');
    });

    it('puts the DOM back when the limit refuses what the browser did', () => {
        const { root, editor } = setup('<p>abc</p>', {}, 3);
        const text = root.querySelector('p')!.firstChild as Text;
        text.data = 'abcd';
        root.dispatchEvent(new InputEvent('input', { inputType: 'insertText', bubbles: true }));
        expect(editor.getText()).toBe('abc');
        expect(root.querySelector('p')!.textContent).toBe('abc');
    });

    it('ignores its own drawing', () => {
        const { root, editor } = setup('<p>abc</p>');
        editor.setContent('<p>xyz</p>');
        root.dispatchEvent(new InputEvent('input', { bubbles: true }));
        expect(editor.can('undo')).toBe(false);
    });
});
