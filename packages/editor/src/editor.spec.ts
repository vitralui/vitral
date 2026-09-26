import { en, ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { createTextEditor } from './editor';
import type { TextEditorHandle } from './types';

let handle: TextEditorHandle | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createTextEditor(element, { content: '<p>Hello</p>', ariaLabel: 'Notes', ...config });
    return {
        element,
        content: () => element.querySelector<HTMLElement>('[role="textbox"]')!,
        toolbar: () => element.querySelector<HTMLElement>('[role="toolbar"]'),
        buttons: () => Array.from(element.querySelectorAll<HTMLButtonElement>('[role="toolbar"] button')),
        button: (label: string) => Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.getAttribute('aria-label') === label)!,
        panel: () => document.querySelector<HTMLElement>('[role="dialog"]')
    };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('an editor with no framework in it', () => {
    it('draws a named text area with a toolbar over it', () => {
        const { content, toolbar, buttons } = mount();
        expect(content().getAttribute('role')).toBe('textbox');
        expect(content().getAttribute('aria-multiline')).toBe('true');
        expect(content().getAttribute('aria-label')).toBe('Notes');
        expect(content().getAttribute('contenteditable')).toBe('true');
        expect(toolbar()!.getAttribute('aria-label')).toBe('Formatting');
        expect(buttons().length).toBeGreaterThan(10);
    });

    it('draws its buttons with the icons it ships with, registered or not', () => {
        const { toolbar } = mount();
        const buttons = [...toolbar()!.querySelectorAll('button')].filter((button) => button.getAttribute('aria-label') !== en.editor.blockType);
        expect(buttons.length).toBeGreaterThan(15);
        // Every one of them draws: the names are looked up in the registry, so
        // an application that registered nothing would otherwise get a bar of
        // empty squares.
        expect(buttons.filter((button) => !button.querySelector('svg'))).toEqual([]);
    });

    it('reads the document it was given, and gives it back', () => {
        mount({ content: '<p>Hello <strong>world</strong></p>' });
        expect(handle!.getHTML()).toContain('<strong>world</strong>');
        expect(handle!.getText()).toBe('Hello world');
        expect(handle!.getMarkdown()).toContain('**world**');
    });

    it('runs a command from its button, and says what is on', () => {
        const changed = vi.fn();
        const { button } = mount({ on: { change: changed } });
        handle!.run('selectAll');
        const bold = button('Bold');
        expect(bold.getAttribute('aria-pressed')).toBe('false');
        bold.click();
        expect(handle!.getHTML()).toContain('<strong>');
        expect(changed).toHaveBeenCalled();
        expect(button('Bold').getAttribute('aria-pressed')).toBe('true');
    });

    it('keeps its buttons in step with where the caret is', () => {
        const { button } = mount({ content: '<blockquote><p>Quoted</p></blockquote>' });
        expect(button('Quote').getAttribute('aria-pressed')).toBe('true');
        expect(button('Bold').getAttribute('aria-pressed')).toBe('false');
    });

    it('says which block the caret is in, in the toolbar\u2019s select', () => {
        const { element } = mount({ content: '<h2>Title</h2>' });
        expect(element.querySelector('[role="combobox"]')?.textContent).toBe('Heading 2');
    });

    it('takes a new document from the outside', () => {
        mount();
        handle!.setContent('<p>Replaced</p>');
        expect(handle!.getText()).toBe('Replaced');
    });

    it('draws nothing to press when it is read only', () => {
        const { buttons, content } = mount({ readonly: true });
        expect(content().getAttribute('contenteditable')).toBe('false');
        expect(content().getAttribute('aria-readonly')).toBe('true');
        expect(buttons().every((button) => button.disabled)).toBe(true);
    });

    it('counts what is in it, with the limit where there is one', () => {
        const { element } = mount({ showCount: true, maxLength: 100, content: '<p>Hello</p>' });
        expect(element.querySelector('.vt-editor-count')?.textContent).toBe('5 of 100 characters');
    });

    it('speaks the locale it is given', () => {
        const { toolbar } = mount({ locale: ptBR });
        expect(toolbar()!.getAttribute('aria-label')).toBe('Formatação');
    });

    it('clears up after itself', () => {
        const { element } = mount();
        handle!.destroy();
        handle = null;
        expect(element.children).toHaveLength(0);
    });

    it('has nothing axe objects to', async () => {
        const { element } = mount({ showCount: true, maxLength: 200 });
        await expectNoA11yViolations(element);
    });
});

describe('its panels', () => {
    it('opens the link editor from the toolbar, and puts a link in', () => {
        const { button, panel } = mount();
        handle!.run('selectAll');
        button('Link').click();
        const dialog = panel()!;
        expect(dialog.getAttribute('aria-label')).toBe('Link');
        const url = dialog.querySelector<HTMLInputElement>('input[type="url"]')!;
        url.value = 'https://vitral.dev';
        url.dispatchEvent(new Event('input', { bubbles: true }));
        Array.from(dialog.querySelectorAll('button'))
            .find((b) => b.textContent === 'Apply')!
            .click();
        expect(handle!.getHTML()).toContain('href="https://vitral.dev"');
        expect(panel()).toBeNull();
    });

    it('opens a link it is in on Ctrl+K, filled in, with a way to follow it', () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const { content, panel } = mount({ content: '<p>See <a href="https://vitral.dev" target="_blank">docs</a></p>' });
        handle!.focus();
        const text = content().querySelector('a')!.firstChild!;
        document.getSelection()!.setBaseAndExtent(text, 2, text, 2);
        document.dispatchEvent(new Event('selectionchange'));
        content().dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
        const dialog = panel()!;
        expect(dialog.querySelector<HTMLInputElement>('input[type="url"]')!.value).toBe('https://vitral.dev');
        expect(dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
        Array.from(dialog.querySelectorAll('button'))
            .find((b) => b.textContent === 'Open link')!
            .click();
        expect(open).toHaveBeenCalledWith('https://vitral.dev', '_blank', 'noopener,noreferrer');
        open.mockRestore();
    });

    it('refuses a link with nothing in it, and says so', () => {
        const { button, panel } = mount();
        button('Link').click();
        Array.from(panel()!.querySelectorAll('button'))
            .find((b) => b.textContent === 'Apply')!
            .click();
        expect(panel()!.querySelector('[role="alert"]')?.textContent).toBeTruthy();
    });

    it('offers the palette, and colours the text with it', () => {
        const { button, panel } = mount();
        handle!.run('selectAll');
        button('Text color').click();
        const swatches = Array.from(panel()!.querySelectorAll<HTMLButtonElement>('.vt-editor-swatch'));
        expect(swatches.length).toBeGreaterThan(4);
        swatches[2]!.click();
        expect(handle!.getHTML()).toMatch(/color|style/);
        expect(panel()).toBeNull();
    });

    it('puts a table in from its own panel', () => {
        const { button, panel } = mount();
        button('Table').click();
        const dialog = panel()!;
        dialog.querySelector<HTMLInputElement>('[data-vt-table="rows"]')!.value = '2';
        dialog.querySelector<HTMLInputElement>('[data-vt-table="columns"]')!.value = '3';
        Array.from(dialog.querySelectorAll('button'))
            .find((b) => b.textContent === 'Insert table')!
            .click();
        const html = handle!.getHTML();
        expect(html).toContain('<table');
        expect((html.match(/<th|<td/g) ?? []).length).toBe(6);
    });

    it('has nothing axe objects to with a panel open', async () => {
        const { button } = mount();
        button('Link').click();
        await expectNoA11yViolations(document.body);
    });
});

describe('the menu a slash opens', () => {
    const type = (text: string) => {
        for (const char of text) handle!.typeText(char);
    };
    const menu = () => document.querySelector<HTMLElement>('[role="listbox"]');
    const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));

    it('opens on a slash in an empty block, and lists the blocks', () => {
        mount({ content: '<p></p>' });
        type('/');
        expect(menu()).not.toBeNull();
        expect(options().length).toBeGreaterThan(8);
        expect(options()[0]!.textContent).toContain('Text');
    });

    it('narrows as it is typed, and says when nothing matches', () => {
        mount({ content: '<p></p>' });
        type('/head');
        expect(options().map((option) => option.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Heading 1')]));
        expect(options()).toHaveLength(3);
        type('zzz');
        expect(menu()).toBeNull();
        expect(document.querySelector('[role="status"]')?.textContent).toContain('zzz');
    });

    it('runs what it lands on, taking the slash and the query with it', () => {
        const { content } = mount({ content: '<p></p>' });
        type('/quote');
        content().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(menu()).toBeNull();
        // The slash and what was typed after it went with it: what is left is an
        // empty quote, which says nothing in HTML until something is in it.
        expect(handle!.getText()).toBe('');
        type('Quoted');
        expect(handle!.getHTML()).toContain('<blockquote');
        expect(handle!.getText()).toBe('Quoted');
    });

    it('walks with the arrows and gives up on Escape', () => {
        const { content } = mount({ content: '<p></p>' });
        type('/');
        const first = options()[0]!;
        content().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        expect(options()[1]!.getAttribute('aria-selected')).toBe('true');
        expect(first.getAttribute('aria-selected')).toBe('false');
        content().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        expect(menu()).toBeNull();
    });

    it('stays away when it is turned off', () => {
        mount({ content: '<p></p>', slashMenu: false });
        type('/');
        expect(menu()).toBeNull();
    });

    it('takes the commands it is given', () => {
        const run = vi.fn();
        mount({ content: '<p></p>', slashMenu: [{ id: 'callout', label: 'Callout', description: 'A box that stands out', run }] });
        type('/call');
        expect(options()).toHaveLength(1);
        options()[0]!.click();
        expect(run).toHaveBeenCalledTimes(1);
    });
});

describe('the handle beside a block', () => {
    const grip = (element: HTMLElement) => element.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const item = (label: string) => items().find((entry) => entry.textContent?.includes(label))!;

    /** Two paragraphs, with the caret in the second: what a block action acts on. */
    function twoBlocks(config: Record<string, unknown> = {}) {
        const mounted = mount({ content: '<p></p>', toolbar: false, ...config });
        handle!.typeText('one');
        mounted.content().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        handle!.typeText('two');
        return mounted;
    }

    it('sits in the editor, named, and opens a menu', () => {
        const { element } = twoBlocks();
        const button = grip(element)!;
        expect(button).not.toBeNull();
        expect(button.getAttribute('aria-label')).toBe(en.editor.blockMenu);
        expect(button.getAttribute('aria-expanded')).toBe('false');
        // It is the editor's own furniture, never part of what is edited.
        expect(button.getAttribute('contenteditable')).toBe('false');
        expect(menu()).toBeNull();
        button.click();
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(items().map((entry) => entry.textContent)).toEqual(['Duplicate', 'Move up', 'Move down', 'Turn into text', 'Delete']);
    });

    it('duplicates the block the caret is in', () => {
        const { element } = twoBlocks();
        grip(element)!.click();
        item('Duplicate').click();
        expect(handle!.getHTML()).toBe('<p>one</p><p>two</p><p>two</p>');
        expect(menu()).toBeNull();
    });

    it('moves it, and deletes it', () => {
        const { element } = twoBlocks();
        grip(element)!.click();
        item('Move up').click();
        expect(handle!.getHTML()).toBe('<p>two</p><p>one</p>');
        grip(element)!.click();
        item('Delete').click();
        expect(handle!.getHTML()).toBe('<p>one</p>');
    });

    it('turns it back into text', () => {
        const { element } = twoBlocks();
        handle!.run('toggleHeading', 2);
        expect(handle!.getHTML()).toBe('<p>one</p><h2>two</h2>');
        grip(element)!.click();
        item('Turn into text').click();
        expect(handle!.getHTML()).toBe('<p>one</p><p>two</p>');
    });

    it('stays away when it is turned off', () => {
        const { element } = twoBlocks({ blockMenu: false });
        expect(grip(element)).toBeNull();
    });

    it('takes the actions it is given, and hides those the block is not for', () => {
        const run = vi.fn();
        const { element } = twoBlocks({
            blockMenu: [
                { id: 'note', label: 'Make a note', run },
                { id: 'headingOnly', label: 'Only on headings', when: (block: { type: string }) => block.type === 'heading', run: () => {} }
            ]
        });
        grip(element)!.click();
        expect(items().map((entry) => entry.textContent)).toEqual(['Make a note']);
        items()[0]!.click();
        expect(run).toHaveBeenCalledTimes(1);
        expect(run.mock.calls[0]![1]).toMatchObject({ type: 'paragraph' });
        expect(run.mock.calls[0]![2]).toBe(1);
    });

    it('has nothing axe objects to with the menu open', async () => {
        const { element } = twoBlocks();
        grip(element)!.click();
        await expectNoA11yViolations(document.body);
    });
});
