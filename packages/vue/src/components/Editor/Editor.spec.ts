import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import { useEditor } from '../../composables/useEditor';
import { Editor, EditorButton, EditorContent, EditorCount, EditorFooter, EditorRoot, EditorToolbar, EditorToolbarGroup, type EditorJSON } from './index';

const flush = async () => {
    for (let i = 0; i < 3; i++) await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
};

function mountEditor(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = { 'aria-label': 'Notes' }) {
    const value = ref((props.modelValue as string | undefined) ?? '<p>Hello world</p>');
    const changes = vi.fn();
    const wrapper = mountVt(
        defineComponent(() => () =>
            h(Editor, {
                ...attrs,
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v ?? ''),
                onTextChange: changes
            })
        )
    );
    const root = wrapper.element as HTMLElement;
    const content = () => root.querySelector<HTMLElement>('[role="textbox"]')!;
    const button = (label: string) => Array.from(root.querySelectorAll<HTMLButtonElement>('[role="toolbar"] button')).find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === label)!;
    const select = (node: Node, from: number, to = from, end: Node = node) => {
        document.getSelection()!.setBaseAndExtent(node, from, end, to);
        content().dispatchEvent(new Event('selectionchange'));
        document.dispatchEvent(new Event('selectionchange'));
    };
    const focusText = () => {
        content().focus();
    };
    return { wrapper, root, value, changes, content, button, select, focusText };
}

function beforeInput(el: HTMLElement, inputType: string, data: string | null = null) {
    el.dispatchEvent(new InputEvent('beforeinput', { inputType, data, bubbles: true, cancelable: true }));
}

describe('Editor', () => {
    it('shows the v-model as rich text and writes edits back as HTML', async () => {
        const { content, value, changes, select, focusText } = mountEditor();
        await flush();
        expect(content().innerHTML).toBe('<p>Hello world</p>');
        focusText();
        select(content().querySelector('p')!.firstChild!, 5);
        beforeInput(content(), 'insertText', ',');
        await flush();
        expect(value.value).toBe('<p>Hello, world</p>');
        expect(changes).toHaveBeenCalledWith(expect.objectContaining({ htmlValue: '<p>Hello, world</p>', textValue: 'Hello, world', source: 'user' }));
        value.value = '<h2>From outside</h2>';
        await flush();
        expect(content().innerHTML).toBe('<h2>From outside</h2>');
        expect(changes).toHaveBeenCalledTimes(1);
    });

    it('is a labelled multi-line textbox, described by its help and count', async () => {
        const { content, root } = mountEditor({ maxLength: 50, placeholder: 'Type…', invalid: true });
        await flush();
        const text = content();
        expect(text.getAttribute('aria-multiline')).toBe('true');
        expect(text.getAttribute('aria-label')).toBe('Notes');
        expect(text.getAttribute('contenteditable')).toBe('true');
        expect(text.getAttribute('aria-invalid')).toBe('true');
        expect(text.getAttribute('aria-placeholder')).toBe('Type…');
        const described = text.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent);
        expect(described).toEqual(['2 words · 11 of 50 characters', expect.stringContaining('Alt+F10')]);
        expect(root.classList).toContain('vt-field-invalid');
    });

    it('is named by a <label for>, which also focuses it', async () => {
        const wrapper = mountVt(defineComponent(() => () => [h('label', { for: 'bio' }, 'Bio'), h(Editor, { id: 'bio', modelValue: '<p>x</p>' })]));
        await flush();
        const text = wrapper.find('[role="textbox"]').element as HTMLElement;
        expect(text.id).toBe('bio');
        expect(document.getElementById(text.getAttribute('aria-labelledby')!)?.textContent).toBe('Bio');
        (wrapper.find('label').element as HTMLElement).click();
        expect(document.activeElement).toBe(text);
    });

    it('shows a placeholder only while empty', async () => {
        const { content, value } = mountEditor({ modelValue: '', placeholder: 'Write…' });
        await flush();
        expect(content().classList).toContain('vt-editor-content-empty');
        expect(content().dataset.placeholder).toBe('Write…');
        value.value = '<p>x</p>';
        await flush();
        expect(content().classList).not.toContain('vt-editor-content-empty');
    });

    it('reflects the marks and blocks at the selection in its toggle buttons, and changes them', async () => {
        const { content, button, select, value, focusText } = mountEditor({ modelValue: '<p><strong>bold</strong> plain</p><ul><li><p>item</p></li></ul>' });
        await flush();
        focusText();
        const bold = button('Bold');
        expect(bold.getAttribute('aria-pressed')).toBe('true');
        select(content().querySelector('p')!.lastChild!, 3);
        await flush();
        expect(bold.getAttribute('aria-pressed')).toBe('false');
        select(content().querySelector('li p')!.firstChild!, 2);
        await flush();
        expect(button('Bulleted list').getAttribute('aria-pressed')).toBe('true');
        expect(button('Numbered list').getAttribute('aria-pressed')).toBe('false');
        expect(button('Text style: Paragraph')).toBeTruthy();
        button('Numbered list').click();
        await flush();
        expect(value.value).toBe('<p><strong>bold</strong> plain</p><ol><li><p>item</p></li></ol>');
        expect(button('Numbered list').getAttribute('aria-pressed')).toBe('true');
        select(content().querySelector('p')!.lastChild!, 1, 6);
        button('Italic').click();
        await flush();
        expect(value.value).toBe('<p><strong>bold</strong> <em>plain</em></p><ol><li><p>item</p></li></ol>');
        expect(button('Italic').getAttribute('aria-pressed')).toBe('true');
        expect(button('Undo').disabled).toBe(false);
        expect(button('Redo').disabled).toBe(true);
        button('Undo').click();
        await flush();
        expect(value.value).toBe('<p><strong>bold</strong> plain</p><ol><li><p>item</p></li></ol>');
    });

    it('lists shortcuts in tooltips and aria-keyshortcuts', async () => {
        const { button } = mountEditor();
        await flush();
        expect(button('Bold').getAttribute('aria-keyshortcuts')).toMatch(/^(Control|Meta)\+B$/);
        expect(button('Numbered list').getAttribute('aria-keyshortcuts')).toMatch(/\+Shift\+7$/);
        expect(button('Undo').getAttribute('aria-keyshortcuts')).toMatch(/\+Z$/);
    });

    it('runs keyboard shortcuts', async () => {
        const { content, select, value, focusText } = mountEditor();
        await flush();
        focusText();
        const text = content().querySelector('p')!.firstChild!;
        select(text, 0, 5);
        await press(content(), 'b', { ctrlKey: true });
        await press(content(), 'u', { ctrlKey: true });
        await flush();
        expect(value.value).toBe('<p><strong><u>Hello</u></strong> world</p>');
        await press(content(), '@', { ctrlKey: true, altKey: true, code: 'Digit2' });
        await flush();
        expect(value.value).toBe('<h2><strong><u>Hello</u></strong> world</h2>');
        await press(content(), 'z', { ctrlKey: true });
        await press(content(), 'z', { ctrlKey: true });
        await press(content(), 'z', { ctrlKey: true });
        await flush();
        expect(value.value).toBe('<p>Hello world</p>');
        await press(content(), 'y', { ctrlKey: true });
        await flush();
        expect(value.value).toBe('<p><strong>Hello</strong> world</p>');
    });

    it('follows the toolbar pattern: one tab stop, arrows, Alt+F10 in and Escape out', async () => {
        const { root, content, focusText } = mountEditor();
        await flush();
        const toolbar = root.querySelector<HTMLElement>('[role="toolbar"]')!;
        expect(toolbar.getAttribute('aria-label')).toBe('Formatting');
        expect(toolbar.getAttribute('aria-controls')).toBe(content().id);
        const enabled = () => Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button')).filter((b) => !b.disabled);
        expect(enabled().filter((b) => b.tabIndex === 0)).toHaveLength(1);
        focusText();
        await press(content(), 'F10', { altKey: true });
        const first = enabled()[0]!;
        expect(document.activeElement).toBe(first);
        expect(first.getAttribute('aria-haspopup')).toBe('menu');
        await press(first, 'ArrowRight');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Bold');
        expect((document.activeElement as HTMLElement).tabIndex).toBe(0);
        await press(document.activeElement!, 'End');
        expect(document.activeElement).toBe(enabled().at(-1));
        await press(document.activeElement!, 'Home');
        expect(document.activeElement).toBe(first);
        await press(document.activeElement!, 'ArrowLeft');
        expect(document.activeElement).toBe(enabled().at(-1));
        await press(document.activeElement!, 'Escape');
        expect(document.activeElement).toBe(content());
    });

    it('keeps focus on a toolbar button used from the keyboard', async () => {
        const { button, value } = mountEditor();
        await flush();
        const bold = button('Bold');
        bold.focus();
        bold.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
        await flush();
        expect(document.activeElement).toBe(bold);
        expect(bold.getAttribute('aria-pressed')).toBe('true');
        expect(value.value).toBe('<p>Hello world</p>');
    });

    it('opens the block type menu and sets the block', async () => {
        const { button, value } = mountEditor();
        await flush();
        const trigger = button('Text style: Paragraph');
        trigger.focus();
        await press(trigger, 'ArrowDown');
        await flush();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        const items = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
        expect(items.map((i) => i.textContent?.trim())).toEqual(['Paragraph', 'Heading 1', 'Heading 2', 'Heading 3', 'Code block']);
        expect(document.activeElement).toBe(items[0]);
        await expectNoA11yViolations();
        items[2]!.click();
        await flush();
        expect(value.value).toBe('<h2>Hello world</h2>');
        expect(button('Text style: Heading 2')).toBeTruthy();
    });

    it('picks a colour from the palette grid with the keyboard', async () => {
        const { button, value, content, select, focusText } = mountEditor();
        await flush();
        focusText();
        select(content().querySelector('p')!.firstChild!, 0, 5);
        const trigger = button('Text color');
        trigger.focus();
        trigger.click();
        await flush();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        const grid = document.querySelector<HTMLElement>('[role="dialog"] [role="group"]')!;
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Default color');
        await press(document.activeElement!, 'ArrowRight');
        await press(document.activeElement!, 'ArrowDown');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Teal');
        await press(document.activeElement!, 'End');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Pink');
        expect(grid.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
        await expectNoA11yViolations();
        (document.activeElement as HTMLElement).click();
        await flush();
        expect(value.value).toBe('<p><span data-color="pink" style="color: var(--vt-editor-palette-pink-color, #db2777)">Hello</span> world</p>');
        expect(document.activeElement).toBe(trigger);
    });

    it('edits links in a popover opened with Ctrl+K, refusing unsafe addresses', async () => {
        const { content, select, value, focusText } = mountEditor();
        await flush();
        focusText();
        select(content().querySelector('p')!.firstChild!, 6, 11);
        await press(content(), 'k', { ctrlKey: true });
        await flush();
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
        expect(dialog.getAttribute('aria-label')).toBe('Link');
        const url = dialog.querySelector<HTMLInputElement>('input[type="url"]')!;
        expect(document.activeElement).toBe(url);
        await expectNoA11yViolations();
        url.value = 'javascript:alert(1)';
        url.dispatchEvent(new Event('input'));
        dialog.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();
        expect(url.getAttribute('aria-invalid')).toBe('true');
        expect(document.getElementById(url.getAttribute('aria-describedby')!)?.textContent).toContain('relative path');
        expect(value.value).toBe('<p>Hello world</p>');
        url.value = 'example.com';
        url.dispatchEvent(new Event('input'));
        dialog.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();
        expect(value.value).toBe('<p>Hello <a href="https://example.com" rel="noopener noreferrer nofollow">world</a></p>');
        expect(document.activeElement).toBe(content());

        select(content().querySelector('a')!.firstChild!, 2);
        await press(content(), 'k', { ctrlKey: true });
        await flush();
        const again = document.querySelector<HTMLElement>('[role="dialog"]')!;
        expect(again.querySelector<HTMLInputElement>('input[type="url"]')!.value).toBe('https://example.com');
        const remove = Array.from(again.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Remove link')!;
        remove.click();
        await flush();
        expect(value.value).toBe('<p>Hello world</p>');
    });

    it('requires alternative text before inserting an image', async () => {
        const { button, value, content, select, focusText } = mountEditor();
        await flush();
        focusText();
        select(content().querySelector('p')!.firstChild!, 11);
        button('Image').click();
        await flush();
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
        const [src, alt] = Array.from(dialog.querySelectorAll<HTMLInputElement>('input'));
        src!.value = 'https://example.com/cat.png';
        src!.dispatchEvent(new Event('input'));
        dialog.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();
        expect(alt!.getAttribute('aria-invalid')).toBe('true');
        expect(value.value).toBe('<p>Hello world</p>');
        alt!.value = 'A cat';
        alt!.dispatchEvent(new Event('input'));
        dialog.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();
        expect(value.value).toBe('<p>Hello world</p><img src="https://example.com/cat.png" alt="A cat"><p></p>');
    });

    it('inserts and edits tables from its menu', async () => {
        const { button, value, content, select, focusText } = mountEditor({ toolbar: [['table']] });
        await flush();
        focusText();
        select(content().querySelector('p')!.firstChild!, 11);
        button('Table').click();
        await flush();
        const item = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find((i) => i.textContent?.trim() === label)!;
        expect(item('Add row below').getAttribute('aria-disabled')).toBe('true');
        item('Insert table').click();
        await flush();
        expect(content().querySelectorAll('th')).toHaveLength(3);
        expect(button('Table').classList).toContain('vt-editor-button-active');
        button('Table').click();
        await flush();
        item('Delete table').click();
        await flush();
        expect(value.value).toBe('<p>Hello world</p><p></p>');
    });

    it('sanitises pasted HTML', async () => {
        const { content, select, value, focusText } = mountEditor();
        await flush();
        focusText();
        select(content().querySelector('p')!.firstChild!, 5);
        const event = new Event('paste', { bubbles: true, cancelable: true });
        const data: Record<string, string> = { 'text/html': '<b onmouseover="alert(1)">!</b><img src=x onerror=alert(1) alt=""><script>alert(2)</script><a href="javascript:alert(3)">?</a>' };
        Object.defineProperty(event, 'clipboardData', { value: { getData: (type: string) => data[type] ?? '' } });
        content().dispatchEvent(event);
        await flush();
        expect(event.defaultPrevented).toBe(true);
        expect(value.value).toBe('<p>Hello<strong>!</strong></p><img src="x" alt=""><p>? world</p>');
        expect(content().innerHTML).not.toMatch(/onerror|onmouseover|script|javascript/);
    });

    it('can be read and selected but not changed when read-only, and neither when disabled', async () => {
        const { content, root, value, button, select, focusText } = mountEditor({ readonly: true });
        await flush();
        expect(content().getAttribute('contenteditable')).toBe('false');
        expect(content().getAttribute('aria-readonly')).toBe('true');
        expect(content().tabIndex).toBe(0);
        expect(root.classList).toContain('vt-editor-readonly');
        expect(button('Bold').disabled).toBe(true);
        focusText();
        select(content().querySelector('p')!.firstChild!, 1);
        beforeInput(content(), 'insertText', 'x');
        await press(content(), 'b', { ctrlKey: true });
        await flush();
        expect(value.value).toBe('<p>Hello world</p>');
        await expectNoA11yViolations();

        const disabled = mountEditor({ disabled: true });
        await flush();
        expect(disabled.content().getAttribute('aria-disabled')).toBe('true');
        expect(disabled.content().tabIndex).toBe(-1);
        expect(disabled.root.classList).toContain('vt-field-disabled');
    });

    it('stops typing at maxLength and shows the count against it', async () => {
        const { content, root, select, value, focusText } = mountEditor({ maxLength: 12, modelValue: '<p>Hello world</p>' });
        await flush();
        focusText();
        select(content().querySelector('p')!.firstChild!, 11);
        beforeInput(content(), 'insertText', '!');
        beforeInput(content(), 'insertText', '?');
        await flush();
        expect(value.value).toBe('<p>Hello world!</p>');
        const count = root.querySelector('.vt-editor-count')!;
        expect(count.textContent).toBe('2 words · 12 of 12 characters');
        expect(count.classList).toContain('vt-editor-count-limit');
    });

    it('writes v-model:json alongside the HTML, and reads it', async () => {
        const json = ref<EditorJSON | null>({ type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'From JSON' }] }] });
        const html = ref<string>();
        const wrapper = mountVt(
            defineComponent(() => () =>
                h(Editor, { 'aria-label': 'Doc', modelValue: html.value, 'onUpdate:modelValue': (v: string | null | undefined) => (html.value = v ?? undefined), json: json.value, 'onUpdate:json': (v: EditorJSON | null | undefined) => (json.value = v ?? null) })
            )
        );
        await flush();
        const text = wrapper.find('[role="textbox"]').element as HTMLElement;
        expect(text.innerHTML).toBe('<h1>From JSON</h1>');
        text.focus();
        document.getSelection()!.setBaseAndExtent(text.querySelector('h1')!.firstChild!, 9, text.querySelector('h1')!.firstChild!, 9);
        beforeInput(text, 'insertText', '!');
        await flush();
        expect(html.value).toBe('<h1>From JSON!</h1>');
        expect(json.value).toEqual({ type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'From JSON!' }] }] });
        // The echo of its own JSON does not reset the text (or the caret).
        expect(document.getSelection()!.focusOffset).toBe(10);
    });

    it('exposes an API', async () => {
        const editor = ref<InstanceType<typeof Editor> | null>(null);
        const onLoad = vi.fn();
        mountVt(defineComponent(() => () => h(Editor, { ref: editor, 'aria-label': 'API', modelValue: '<p>Some <em>text</em></p>', onLoad })));
        await flush();
        const api = editor.value!;
        expect(onLoad).toHaveBeenCalledWith({ instance: expect.anything() });
        expect(api.getHTML()).toBe('<p>Some <em>text</em></p>');
        expect(api.getText()).toBe('Some text');
        expect(api.getMarkdown()).toBe('Some _text_');
        expect(api.getJSON()?.type).toBe('doc');
        expect(api.can('toggleBold')).toBe(true);
        expect(api.commands!.selectAll()).toBe(true);
        expect(api.commands!.toggleBold()).toBe(true);
        expect(api.isActive('bold')).toBe(true);
        expect(api.getHTML()).toBe('<p><strong>Some <em>text</em></strong></p>');
        api.setContent('<p>Replaced</p>');
        expect(api.getHTML()).toBe('<p>Replaced</p>');
        api.focus();
        expect(document.activeElement?.getAttribute('role')).toBe('textbox');
    });

    it('emits focus, blur and selection changes', async () => {
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        const onSelection = vi.fn();
        const { content, select } = mountEditor({ onFocus, onBlur, onSelectionChange: onSelection });
        await flush();
        content().focus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        select(content().querySelector('p')!.firstChild!, 0, 5);
        await flush();
        expect(onSelection).toHaveBeenLastCalledWith(expect.objectContaining({ empty: false, selection: { anchor: { path: [0], offset: 0 }, head: { path: [0], offset: 5 } } }));
        content().blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('shows a floating toolbar over a selection', async () => {
        const { content, select, focusText } = mountEditor({ toolbar: false, bubbleMenu: true });
        await flush();
        expect(document.querySelector('[role="toolbar"]')).toBeNull();
        focusText();
        select(content().querySelector('p')!.firstChild!, 0, 5);
        await flush();
        const bubble = document.querySelector<HTMLElement>('.vt-editor-bubble')!;
        expect(bubble.getAttribute('role')).toBe('toolbar');
        expect(bubble.getAttribute('aria-label')).toBe('Selection formatting');
        expect(Array.from(bubble.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))).toEqual(['Bold', 'Italic', 'Underline', 'Strikethrough', 'Inline code', 'Link', 'Text color']);
        await expectNoA11yViolations();
        await press(content(), 'F10', { altKey: true });
        expect(document.activeElement).toBe(bubble.querySelector('button'));
        await press(document.activeElement!, 'Escape');
        expect(document.activeElement).toBe(content());
        await press(content(), 'Escape');
        await flush();
        expect(document.querySelector('.vt-editor-bubble')).toBeNull();
        select(content().querySelector('p')!.firstChild!, 0, 3);
        await flush();
        expect(document.querySelector('.vt-editor-bubble')).not.toBeNull();
    });

    it('restyles through pass-through, tokens and unstyled', async () => {
        const styled = mountEditor({ pt: { root: 'my-root', toolbar: { class: 'my-toolbar' }, content: 'my-content', button: 'my-button' }, dt: { editor: { content: { minHeight: '3rem' } } } });
        await flush();
        expect(styled.root.classList).toContain('my-root');
        expect(styled.root.style.getPropertyValue('--vt-editor-content-min-height')).toBe('3rem');
        expect(styled.root.querySelector('[role="toolbar"]')!.classList).toContain('my-toolbar');
        expect(styled.content().classList).toContain('my-content');
        expect(styled.button('Bold').classList).toContain('my-button');
        const bare = mountEditor({ unstyled: true });
        await flush();
        expect(bare.root.className).toBe('');
        expect(bare.content().className).toBe('');
        expect(bare.button('Bold').className).toBe('');
    });

    it('has no accessibility violations, idle and with its toolbar in use', async () => {
        mountEditor({ bubbleMenu: true, maxLength: 200 });
        mountVt(defineComponent(() => () => [h('label', { for: 'x' }, 'Labelled'), h(Editor, { id: 'x', modelValue: '<ul data-type="taskList"><li data-type="taskItem"><p>Task</p></li></ul><img src="/a.png" alt="A"><table><tr><th>H</th></tr><tr><td>C</td></tr></table>' })]));
        await flush();
        await expectNoA11yViolations();
    });
});

describe('Editor parts', () => {
    it('are the dotted properties of Editor and named exports alike', () => {
        expect(Editor.Root).toBe(EditorRoot);
        expect(Editor.Content).toBe(EditorContent);
        expect(Editor.Toolbar).toBe(EditorToolbar);
        expect(Editor.ToolbarGroup).toBe(EditorToolbarGroup);
        expect(Editor.Button).toBe(EditorButton);
        expect(Editor.Footer).toBe(EditorFooter);
        expect(Editor.Count).toBe(EditorCount);
        expect(Editor.name).toBe('VtEditor');
    });

    it('compose an editor that shares one state, reachable through useEditor()', async () => {
        const value = ref('<p>parts</p>');
        const WordBadge = defineComponent(() => {
            const { isActive, run, wordCount } = useEditor();
            return () => h('button', { type: 'button', class: 'custom', 'aria-pressed': String(isActive('bold')), onClick: () => run('toggleBold') }, `${wordCount()} words`);
        });
        const wrapper = mountVt(
            defineComponent(() => () =>
                h(
                    Editor.Root,
                    { modelValue: value.value, 'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v ?? ''), 'aria-label': 'Parts' },
                    () => [
                        h(Editor.Toolbar, { ariaLabel: 'Mine' }, () => [h(Editor.ToolbarGroup, () => [h(Editor.Button, { command: 'italic' }), h(WordBadge)])]),
                        h(Editor.Content),
                        h(Editor.Footer, () => h(Editor.Count, { words: false }))
                    ]
                )
            )
        );
        await flush();
        const root = wrapper.element as HTMLElement;
        const text = root.querySelector<HTMLElement>('[role="textbox"]')!;
        expect(text.getAttribute('aria-label')).toBe('Parts');
        expect(root.querySelector('[role="toolbar"]')!.getAttribute('aria-label')).toBe('Mine');
        expect(root.querySelector('.vt-editor-count')!.textContent).toBe('5 characters');
        text.focus();
        document.getSelection()!.setBaseAndExtent(text.querySelector('p')!.firstChild!, 0, text.querySelector('p')!.firstChild!, 5);
        document.dispatchEvent(new Event('selectionchange'));
        const custom = root.querySelector<HTMLButtonElement>('.custom')!;
        custom.click();
        await flush();
        expect(value.value).toBe('<p><strong>parts</strong></p>');
        expect(custom.getAttribute('aria-pressed')).toBe('true');
        expect(custom.textContent).toBe('1 words');
        await expectNoA11yViolations();
    });

    it('opens the slash menu in the text, and runs what it lands on', async () => {
        const { wrapper, content, value } = mountEditor({ modelValue: '<p></p>' });
        const editor = (wrapper.findComponent({ name: 'VtEditorRoot' }).vm as unknown as { editor: { typeText: (text: string) => boolean } }).editor;
        for (const char of '/quote') editor.typeText(char);
        await flush();
        const options = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
        expect(options.length).toBe(1);
        expect(options[0]!.textContent).toContain('Quote');
        content().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await flush();
        editor.typeText('Quoted');
        await flush();
        expect(value.value).toContain('<blockquote>');
        expect(document.querySelector('[role="option"]')).toBeNull();
    });

    it('offers the block actions from the handle beside the text', async () => {
        const { root, value } = mountEditor({ modelValue: '<p>One</p><p>Two</p>' });
        await flush();
        const handle = root.querySelector<HTMLButtonElement>('.vt-editor-block-handle')!;
        expect(handle.getAttribute('aria-label')).toBe('Block actions');
        handle.click();
        await flush();
        const menu = document.querySelector('[role="menu"]')!;
        expect(Array.from(menu.querySelectorAll('[role="menuitem"]')).map((item) => item.textContent)).toEqual([
            'Duplicate',
            'Move up',
            'Move down',
            'Turn into text',
            'Delete'
        ]);
        Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
            .find((item) => item.textContent === 'Duplicate')!
            .click();
        await flush();
        expect(value.value).toBe('<p>One</p><p>One</p><p>Two</p>');
    });

    it('leaves both menus out when they are turned off', async () => {
        const { root } = mountEditor({ modelValue: '<p></p>', slashMenu: false, blockMenu: false });
        await flush();
        expect(root.querySelector('.vt-editor-block-handle')).toBeNull();
    });

    it('refuse to render outside a root, and useEditor() says so', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => mountVt(EditorContent)).toThrow(/inside <EditorRoot>/);
        expect(() => mountVt(defineComponent(() => (useEditor(), () => null)))).toThrow(/useEditor\(\)/);
        warn.mockRestore();
    });
});
