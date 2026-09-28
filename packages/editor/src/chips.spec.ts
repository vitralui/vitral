import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../vue/test/a11y';
import { createTextEditor } from './editor';
import type { TextEditorHandle } from './types';

let handle: TextEditorHandle | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

const people = [
    { id: 'u1', label: 'Ana Souza', description: 'ana@example.com' },
    { id: 'u2', label: 'Bruno Lima' },
    { id: 'u3', label: 'Carla Dias' }
];

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createTextEditor(element, {
        content: '<p></p>',
        ariaLabel: 'Notes',
        chips: [
            { char: '@', kind: 'mention', items: (q: string) => people.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())) },
            { char: '#', kind: 'tag', items: async (q: string) => [{ id: `tag-${q || 'new'}`, label: q || 'new' }] }
        ],
        ...config
    });
    const content = () => element.querySelector<HTMLElement>('[role="textbox"]')!;
    const key = (k: string) => content().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    return { element, content, key };
}

const type = (text: string) => {
    for (const char of text) handle!.typeText(char);
};
const list = () => document.querySelector<HTMLElement>('[role="listbox"]');
const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).map((o) => o.textContent);
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('chips in the editor', () => {
    it('offers suggestions when a trigger starts a word, and narrows them as it is typed', () => {
        mount();
        type('Ask @');
        expect(list()!.getAttribute('aria-label')).toBe('Suggestions');
        expect(options()).toHaveLength(3);
        type('br');
        expect(options()).toEqual(['Bruno Lima']);
    });

    it('does not open for a trigger in the middle of a word', () => {
        mount();
        type('mail@home');
        expect(list()).toBeNull();
    });

    it('puts the chosen one in as a chip, in place of the trigger and the words', () => {
        const { key, element } = mount();
        type('Ask @an');
        key('Enter');
        expect(list()).toBeNull();
        expect(handle!.getHTML()).toBe('<p>Ask <span data-chip="u1" data-kind="mention" contenteditable="false">Ana Souza</span>&nbsp;</p>');
        const chip = element.querySelector('[data-chip]')!;
        expect(chip.classList.contains('vt-editor-chip-mention')).toBe(true);
        type('about it');
        expect(handle!.getText()).toBe('Ask Ana Souza about it');
    });

    it('waits for suggestions that come later, and takes several triggers', async () => {
        const { key } = mount();
        type('#urgent');
        await settle();
        expect(options()).toEqual(['urgent']);
        key('Enter');
        expect(handle!.getHTML()).toContain('data-chip="tag-urgent" data-kind="tag"');
    });

    it('walks with the arrows and gives up on Escape', () => {
        const { key } = mount();
        type('@');
        key('ArrowDown');
        key('Escape');
        expect(list()).toBeNull();
        expect(handle!.getText()).toBe('@');
    });

    it('is put in from code too', () => {
        mount({ content: '<p>Hi </p>' });
        handle!.run('selectAll');
        handle!.run('insertChip', { id: 'v1', label: 'first_name', kind: 'variable' });
        expect(handle!.getHTML()).toContain('data-kind="variable"');
    });

    it('has no accessibility violations with the list open', async () => {
        const { element } = mount();
        type('@');
        await expectNoA11yViolations(element);
    });
});
