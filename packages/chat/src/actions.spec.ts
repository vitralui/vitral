import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../vue/test/a11y';
import { createChat, type ChatHandle } from './chat';
import type { ChatConfig, ChatMessage } from './engine/types';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const thread: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Summarise the report.' },
    { id: 2, role: 'assistant', content: 'Revenue rose 12%.' },
    { id: 3, role: 'assistant', content: 'Still thinking', streaming: true }
];

const handles: ChatHandle[] = [];
afterEach(() => {
    handles.splice(0).forEach((c) => c.destroy());
    document.body.innerHTML = '';
    Reflect.deleteProperty(navigator, 'clipboard');
});

function mount(config: ChatConfig = {}) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    handles.push(createChat(el, { messages: thread, ariaLabel: 'Assistant', ...config }));
    const buttons = (id: number) => [...el.querySelectorAll<HTMLButtonElement>(`[id$="-m${thread.findIndex((m) => m.id === id)}"] .vt-chat-message-action`)];
    return { el, buttons };
}

describe('message actions', () => {
    it("go under the assistant's settled messages, named for what they do", () => {
        const { buttons } = mount({ messageActions: ['copy', 'regenerate'] });
        expect(buttons(1)).toHaveLength(0);
        expect(buttons(2).map((b) => b.getAttribute('aria-label'))).toEqual(['Copy', 'Regenerate']);
        expect(buttons(3)).toHaveLength(0);
    });

    it('copy copies the text, shows a tick, says so, and reports it', async () => {
        const writeText = vi.fn(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        const action = vi.fn();
        const { el, buttons } = mount({ messageActions: ['copy'], on: { 'message-action': action } });
        buttons(2)[0]!.click();
        await settle();
        await settle();
        expect(writeText).toHaveBeenCalledWith('Revenue rose 12%.');
        expect(action).toHaveBeenCalledWith({ action: 'copy', message: thread[1] });
        expect(buttons(2)[0]!.getAttribute('aria-label')).toBe('Copied');
        expect(buttons(2)[0]!.classList.contains('vt-chat-message-action-copied')).toBe(true);
        expect(el.querySelector('[role="status"]')!.textContent).toBe('Copied');
    });

    it("takes the application's own, as toggles, for whichever speakers it names", () => {
        const action = vi.fn();
        const { buttons } = mount({
            locale: ptBR,
            messageActions: [
                { id: 'like', label: 'Good answer', icon: 'star', pressed: (m) => m.id === 2 },
                { id: 'quote', label: 'Quote', roles: ['user', 'assistant'], showLabel: true }
            ],
            on: { 'message-action': action }
        });
        const [like, quote] = buttons(2);
        expect(like!.getAttribute('aria-pressed')).toBe('true');
        expect(quote!.textContent).toBe('Quote');
        expect(quote!.hasAttribute('aria-label')).toBe(false);
        expect(buttons(1).map((b) => b.textContent)).toEqual(['Quote']);
        like!.click();
        expect(action).toHaveBeenCalledWith({ action: 'like', message: thread[1] });
    });

    it('rates an answer with the built-in thumbs, pressed by the feedback the message carries', () => {
        const rated: ChatMessage[] = [thread[0]!, { ...thread[1]!, feedback: 'dislike' }];
        const el = document.createElement('div');
        document.body.appendChild(el);
        handles.push(createChat(el, { messages: rated, messageActions: ['like', 'dislike'] }));
        const [like, dislike] = [...el.querySelectorAll<HTMLButtonElement>('.vt-chat-message-action')];
        expect(like!.getAttribute('aria-label')).toBe('Good answer');
        expect(like!.getAttribute('aria-pressed')).toBe('false');
        expect(dislike!.getAttribute('aria-label')).toBe('Bad answer');
        expect(dislike!.getAttribute('aria-pressed')).toBe('true');
        expect(like!.querySelector('svg.vt-icon')).not.toBeNull();
    });

    it('has no accessibility violations', async () => {
        mount({ messageActions: ['copy', 'regenerate', 'like', 'dislike'] });
        await expectNoA11yViolations();
    });
});
