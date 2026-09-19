import { ptBR } from '@vitral/core';
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
