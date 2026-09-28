import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { createTextEditor } from './editor';
import type { TextEditorHandle } from './types';

let handle: TextEditorHandle | null = null;
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createTextEditor(element, { content: '<p>The cat sat on the <strong>cat</strong> mat.</p><p>A category.</p>', ariaLabel: 'Notes', ...config });
    const bar = () => element.querySelector<HTMLElement>('[role="search"]');
    const inputs = () => Array.from(element.querySelectorAll<HTMLInputElement>('[role="search"] input'));
    const button = (label: string) => Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((b) => (b.getAttribute('aria-label') ?? b.textContent) === label)!;
    const count = () => element.querySelector('.vt-editor-find-count')!.textContent;
    const type = (input: HTMLInputElement, value: string) => {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const content = () => element.querySelector<HTMLElement>('[role="textbox"]')!;
    return { element, bar, inputs, button, count, type, content };
}

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('find and replace in the editor', () => {
    it('opens on Ctrl+F, counts the matches and steps through them', async () => {
        const { bar, inputs, count, type, content, button } = mount();
        content().dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', ctrlKey: true, bubbles: true, cancelable: true }));
        expect(bar()).not.toBeNull();
        expect(inputs()).toHaveLength(1);
        type(inputs()[0]!, 'cat');
        expect(count()).toBe('1 of 3');
        button('Next match').click();
        expect(count()).toBe('2 of 3');
        button('Whole word').click();
        expect(count()).toBe('2 of 2');
        button('Previous match').click();
        expect(count()).toBe('1 of 2');
        type(inputs()[0]!, 'dog');
        expect(count()).toBe('No results');
        await settle();
        await expectNoA11yViolations(bar()!);
    });

    it('replaces one or all, keeping the formatting, in one undo step each', () => {
        const { inputs, type, button } = mount();
        handle!.openFind({ replace: true, query: 'cat' });
        button('Whole word').click();
        expect(inputs()).toHaveLength(2);
        type(inputs()[1]!, 'dog');
        button('Replace').click();
        expect(handle!.getText()).toContain('The dog sat on the cat mat.');
        button('Replace all').click();
        expect(handle!.getHTML()).toContain('<strong>dog</strong>');
        expect(handle!.getText()).toContain('A category.');
        handle!.run('undo');
        expect(handle!.getHTML()).toContain('<strong>cat</strong>');
    });

    it('only finds in a read-only editor, and closes on Escape', () => {
        const { bar, inputs, button } = mount({ readonly: true });
        handle!.openFind({ replace: true, query: 'cat' });
        expect(inputs()).toHaveLength(1);
        expect(button('Toggle replace')).toBeUndefined();
        inputs()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        expect(bar()).toBeNull();
    });

    it('leaves Ctrl+F to the browser when turned off', () => {
        const { bar, content } = mount({ find: false });
        const event = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', ctrlKey: true, bubbles: true, cancelable: true });
        content().dispatchEvent(event);
        expect(bar()).toBeNull();
        expect(event.defaultPrevented).toBe(false);
    });
});

describe('the find field', () => {
    it('takes focus when the bar opens, even before anything is found', async () => {
        const { inputs } = mount();
        handle!.openFind();
        await settle();
        expect(document.activeElement).toBe(inputs()[0]);
    });
});
