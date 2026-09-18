import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEditor } from './editor';
import { createHistory, recordHistory, redoHistory, undoHistory } from './history';
import { applyEnterRule, applyInputRules } from './inputRules';
import { ariaShortcut, editorKeymap, formatShortcut, keyName, shortcutFor } from './keymap';
import { editorNodes as n, type EditorNode } from './model';
import { createState, type EditorState } from './state';
import { toEditorHTML } from './html';

const at = (path: number[], offset: number) => ({ path, offset });

/** Types text one character at a time, the way the view hands it over. */
function type(editor: ReturnType<typeof createEditor>, text: string) {
    for (const ch of text) editor.typeText(ch);
}

function ruled(doc: EditorNode, path: number[], offset: number, typed: string): string | null {
    const state: EditorState = { ...createState(doc), selection: { anchor: at(path, offset), head: at(path, offset) } };
    const out = applyInputRules(state, typed);
    return out ? toEditorHTML(out.doc) : null;
}

describe('createEditor', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('reads HTML or JSON, and writes HTML, JSON, text and Markdown', () => {
        const editor = createEditor({ content: '<h2>Hi</h2><p>there <strong>you</strong></p>' });
        expect(editor.getHTML()).toBe('<h2>Hi</h2><p>there <strong>you</strong></p>');
        expect(editor.getText()).toBe('Hi\nthere you');
        expect(editor.getMarkdown()).toBe('## Hi\n\nthere **you**');
        expect(editor.getJSON()).toEqual(n.doc(n.h(2, 'Hi'), n.p('there ', n.t('you', n.bold()))));
        const fromJson = createEditor({ content: editor.getJSON() });
        expect(fromJson.getHTML()).toBe(editor.getHTML());
        expect(editor.characterCount()).toBe(11);
        expect(editor.wordCount()).toBe(3);
        expect(createEditor().getHTML()).toBe('');
        expect(createEditor().isEmpty()).toBe(true);
    });

    it('runs commands by name and through `commands`, and answers `can` without changing anything', () => {
        const editor = createEditor({ content: '<p>abc</p>' });
        editor.setSelection({ anchor: at([0], 0), head: at([0], 3) });
        expect(editor.can('toggleBold')).toBe(true);
        expect(editor.getHTML()).toBe('<p>abc</p>');
        expect(editor.commands.toggleBold()).toBe(true);
        expect(editor.isActive('bold')).toBe(true);
        expect(editor.run('setHeading', 1)).toBe(true);
        expect(editor.getHTML()).toBe('<h1><strong>abc</strong></h1>');
        expect(editor.can('setHeading', 1)).toBe(false);
        expect(editor.can('sinkListItem')).toBe(false);
        expect(editor.run('liftListItem')).toBe(false);
    });

    it('notifies subscribers with what changed and where it came from', () => {
        const editor = createEditor({ content: '<p>a</p>' });
        const updates: { doc: boolean; sel: boolean; origin: string }[] = [];
        const stop = editor.subscribe((u) => updates.push({ doc: u.docChanged, sel: u.selectionChanged, origin: u.origin }));
        editor.setSelection({ anchor: at([0], 1), head: at([0], 1) });
        editor.typeText('b');
        editor.undo();
        editor.setContent('<p>new</p>');
        stop();
        editor.typeText('x');
        expect(updates).toEqual([
            { doc: false, sel: true, origin: 'user' },
            { doc: true, sel: true, origin: 'user' },
            { doc: true, sel: true, origin: 'history' },
            { doc: true, sel: true, origin: 'api' }
        ]);
    });

    it('groups consecutive typing into one undo step, and starts a new one after a pause or a move', () => {
        const editor = createEditor();
        type(editor, 'hello');
        vi.advanceTimersByTime(1000);
        type(editor, ' world');
        expect(editor.getHTML()).toBe('<p>hello world</p>');
        editor.undo();
        expect(editor.getHTML()).toBe('<p>hello</p>');
        editor.undo();
        expect(editor.getHTML()).toBe('');
        expect(editor.can('undo')).toBe(false);
        editor.redo();
        editor.redo();
        expect(editor.getHTML()).toBe('<p>hello world</p>');
        expect(editor.can('redo')).toBe(false);
        editor.setSelection({ anchor: at([0], 5), head: at([0], 5) });
        type(editor, ',');
        editor.setSelection({ anchor: at([0], 12), head: at([0], 12) });
        type(editor, '!');
        editor.undo();
        expect(editor.getHTML()).toBe('<p>hello, world</p>');
    });

    it('restores the selection with each undo and redo, and forgets redo after a new edit', () => {
        const editor = createEditor({ content: '<p>abc</p>' });
        editor.setSelection({ anchor: at([0], 0), head: at([0], 2) });
        editor.commands.toggleItalic();
        editor.setSelection({ anchor: at([0], 3), head: at([0], 3) });
        editor.undo();
        expect(editor.state.selection).toEqual({ anchor: at([0], 0), head: at([0], 2) });
        editor.redo();
        expect(editor.getHTML()).toBe('<p><em>ab</em>c</p>');
        editor.undo();
        type(editor, 'x');
        expect(editor.can('redo')).toBe(false);
    });

    it('refuses edits past maxLength, but allows ones that shorten', () => {
        const editor = createEditor({ content: '<p>abcd</p>', maxLength: 5 });
        editor.setSelection({ anchor: at([0], 4), head: at([0], 4) });
        expect(editor.typeText('e')).toBe(true);
        expect(editor.typeText('f')).toBe(false);
        expect(editor.getText()).toBe('abcde');
        expect(editor.backspace()).toBe(true);
        editor.maxLength = 2;
        expect(editor.backspace()).toBe(true);
        expect(editor.getText()).toBe('abc');
    });

    it('applies Markdown shortcuts as their own undo step, and Backspace right after gives back the typing', () => {
        const editor = createEditor();
        type(editor, '## ');
        expect(editor.getHTML()).toBe('<h2></h2>');
        editor.backspace();
        expect(editor.getHTML()).toBe('<p>##&nbsp;</p>');
        editor.backspace();
        expect(editor.getHTML()).toBe('<p>##</p>');
        editor.setContent('');
        type(editor, 'a **b**');
        expect(editor.getHTML()).toBe('<p>a <strong>b</strong></p>');
        type(editor, ' c');
        expect(editor.getHTML()).toBe('<p>a <strong>b</strong> c</p>');
        editor.undo();
        editor.undo();
        expect(editor.getHTML()).toBe('<p>a **b**</p>');
    });

    it('turns ```lang and Enter into a code block', () => {
        const editor = createEditor();
        type(editor, '```ts');
        editor.enter();
        expect(editor.getHTML()).toBe('<pre><code class="language-ts"></code></pre>');
        type(editor, 'let a');
        editor.enter();
        type(editor, 'b');
        expect(editor.getHTML()).toBe('<pre><code class="language-ts">let a\nb</code></pre>');
    });

    it('replaces its content, resetting the history unless asked not to', () => {
        const editor = createEditor();
        type(editor, 'x');
        editor.setContent('<p>y</p>');
        expect(editor.can('undo')).toBe(false);
        type(editor, 'z');
        editor.setContent('<p>w</p>', { resetHistory: false, emit: false });
        expect(editor.can('undo')).toBe(true);
    });
});

describe('editor history', () => {
    it('records steps and walks them back and forth', () => {
        const a = createState(n.doc(n.p('a')));
        const b = createState(n.doc(n.p('b')));
        let history = recordHistory(createHistory(), a, b, 'other', 0);
        expect(recordHistory(history, b, b, 'other', 1)).toBe(history);
        const undone = undoHistory(history, b)!;
        expect(undone.state.doc).toBe(a.doc);
        history = undone.history;
        expect(undoHistory(history, a)).toBeNull();
        const redone = redoHistory(history, a)!;
        expect(redone.state.doc).toBe(b.doc);
        expect(redoHistory(redone.history, b)).toBeNull();
    });

    it('keeps at most `depth` steps', () => {
        let history = createHistory();
        let state = createState(n.doc(n.p('0')));
        for (let i = 1; i <= 5; i++) {
            const next = createState(n.doc(n.p(String(i))));
            history = recordHistory(history, state, next, 'other', i * 1000, { depth: 3 });
            state = next;
        }
        expect(history.done).toHaveLength(3);
    });
});

describe('editor input rules', () => {
    it('turns line prefixes into blocks', () => {
        expect(ruled(n.doc(n.p('# ')), [0], 2, ' ')).toBe('<h1></h1>');
        expect(ruled(n.doc(n.p('### ')), [0], 4, ' ')).toBe('<h3></h3>');
        expect(ruled(n.doc(n.p('#### ')), [0], 5, ' ')).toBeNull();
        expect(ruled(n.doc(n.p('- ')), [0], 2, ' ')).toBe('<ul><li><p></p></li></ul>');
        expect(ruled(n.doc(n.p('* ')), [0], 2, ' ')).toBe('<ul><li><p></p></li></ul>');
        expect(ruled(n.doc(n.p('1. ')), [0], 3, ' ')).toBe('<ol><li><p></p></li></ol>');
        expect(ruled(n.doc(n.p('4) ')), [0], 3, ' ')).toBe('<ol start="4"><li><p></p></li></ol>');
        expect(ruled(n.doc(n.p('[] ')), [0], 3, ' ')).toContain('data-checked="false"');
        expect(ruled(n.doc(n.p('[x] ')), [0], 4, ' ')).toContain('data-checked="true"');
        expect(ruled(n.doc(n.p('> ')), [0], 2, ' ')).toBe('<blockquote><p></p></blockquote>');
        expect(ruled(n.doc(n.p('```js ')), [0], 6, ' ')).toBe('<pre><code class="language-js"></code></pre>');
        expect(ruled(n.doc(n.p('---')), [0], 3, '-')).toBe('<hr><p></p>');
        expect(ruled(n.doc(n.p('---x')), [0], 3, '-')).toBeNull();
    });

    it('keeps the text after the caret when a prefix rule fires', () => {
        expect(ruled(n.doc(n.p('# Title')), [0], 2, ' ')).toBe('<h1>Title</h1>');
    });

    it('does not start a list inside a list, nor fire mid-line', () => {
        expect(ruled(n.doc(n.ul(n.li('- '))), [0, 0, 0], 2, ' ')).toBeNull();
        expect(ruled(n.doc(n.p('a # ')), [0], 4, ' ')).toBeNull();
        expect(ruled(n.doc(n.h(1, '# ')), [0], 2, ' ')).toBeNull();
    });

    it('marks text wrapped in Markdown delimiters', () => {
        expect(ruled(n.doc(n.p('a **bold**')), [0], 10, '*')).toBe('<p>a <strong>bold</strong></p>');
        expect(ruled(n.doc(n.p('__b__')), [0], 5, '_')).toBe('<p><strong>b</strong></p>');
        expect(ruled(n.doc(n.p('x _it_')), [0], 6, '_')).toBe('<p>x <em>it</em></p>');
        expect(ruled(n.doc(n.p('*it*')), [0], 4, '*')).toBe('<p><em>it</em></p>');
        expect(ruled(n.doc(n.p('~~no~~')), [0], 6, '~')).toBe('<p><s>no</s></p>');
        expect(ruled(n.doc(n.p('use `npm i`')), [0], 11, '`')).toBe('<p>use <code>npm i</code></p>');
    });

    it('leaves words with inner underscores and unbalanced delimiters alone', () => {
        expect(ruled(n.doc(n.p('snake_case_')), [0], 11, '_')).toBeNull();
        expect(ruled(n.doc(n.p('a * b *')), [0], 7, '*')).toBeNull();
        expect(ruled(n.doc(n.p('**')), [0], 2, '*')).toBeNull();
        expect(ruled(n.doc(n.code('**x**')), [0], 5, '*')).toBeNull();
    });

    it('turns ```lang into a code block on Enter only when that is the whole line', () => {
        const state = (text: string, offset: number): EditorState => ({ ...createState(n.doc(n.p(text))), selection: { anchor: at([0], offset), head: at([0], offset) } });
        expect(toEditorHTML(applyEnterRule(state('```py', 5))!.doc)).toBe('<pre><code class="language-py"></code></pre>');
        expect(applyEnterRule(state('```py', 3))).toBeNull();
        expect(applyEnterRule(state('text', 4))).toBeNull();
    });
});

describe('editor keymap', () => {
    it('names keys with Mod for the platform command key', () => {
        expect(keyName({ key: 'b', ctrlKey: true }, false)).toBe('Mod-b');
        expect(keyName({ key: 'b', metaKey: true }, true)).toBe('Mod-b');
        expect(keyName({ key: 'b', ctrlKey: true }, true)).toBe('Ctrl-b');
        expect(keyName({ key: 'Z', ctrlKey: true, shiftKey: true }, false)).toBe('Mod-Shift-z');
        expect(keyName({ key: '&', code: 'Digit7', ctrlKey: true, shiftKey: true }, false)).toBe('Mod-Shift-7');
        expect(keyName({ key: '¡', code: 'Digit1', metaKey: true, altKey: true }, true)).toBe('Mod-Alt-1');
        expect(keyName({ key: 'и', code: 'KeyB', ctrlKey: true }, false)).toBe('Mod-b');
        expect(keyName({ key: 'F10', altKey: true }, false)).toBe('Alt-F10');
        expect(keyName({ key: 'Tab', shiftKey: true }, false)).toBe('Shift-Tab');
    });

    it('binds the documented shortcuts and shows them for people and assistive technology', () => {
        expect(editorKeymap['Mod-b']).toEqual(['toggleBold']);
        expect(editorKeymap['Mod-Alt-2']).toEqual(['toggleHeading', 2]);
        expect(shortcutFor('toggleHeading', [2])).toBe('Mod-Alt-2');
        expect(shortcutFor('toggleStrike')).toBe('Mod-Shift-s');
        expect(shortcutFor('nothing')).toBeUndefined();
        expect(formatShortcut('Mod-Shift-z', false)).toBe('Ctrl+Shift+Z');
        expect(formatShortcut('Mod-Shift-z', true)).toBe('⌘⇧Z');
        expect(ariaShortcut('Mod-b', false)).toBe('Control+B');
        expect(ariaShortcut('Mod-b', true)).toBe('Meta+B');
    });
});
