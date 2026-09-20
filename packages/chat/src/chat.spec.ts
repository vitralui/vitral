import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../vue/test/a11y';
import { createChat, type ChatHandle } from './chat';
import type { ChatConfig, ChatMessage } from './engine/types';

// The framework-free renderer, driven directly: no component in sight.

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const thread: ChatMessage[] = [
    { id: 1, role: 'user', content: 'How do I theme a chart?', at: new Date(2026, 0, 2, 9, 30) },
    { id: 2, role: 'assistant', content: 'Every colour is a token.', author: 'Vitral' }
];

const handles: ChatHandle[] = [];
afterEach(() => {
    handles.splice(0).forEach((c) => c.destroy());
    document.body.innerHTML = '';
});

function mount(config: ChatConfig = {}) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const chat = createChat(el, { messages: thread, ariaLabel: 'Support', ...config });
    handles.push(chat);
    const log = () => el.querySelector<HTMLElement>('.vt-chat-log')!;
    const items = () => [...el.querySelectorAll<HTMLElement>('.vt-chat-message')];
    const input = () => el.querySelector<HTMLTextAreaElement>('.vt-chat-input')!;
    const sendButton = () => el.querySelector<HTMLButtonElement>('.vt-chat-send')!;
    const status = () => el.querySelector('[role="status"]')!.textContent;
    return { el, chat, log, items, input, sendButton, status };
}

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

describe('createChat', () => {
    it('draws the thread as a named list, one item a message', async () => {
        const { el, log, items } = mount();
        expect(log().getAttribute('role')).toBe('list');
        expect(log().getAttribute('aria-label')).toBe('Support');
        expect(items()).toHaveLength(2);
        expect(items().map((m) => m.querySelector('.vt-chat-bubble')?.textContent)).toEqual(['How do I theme a chart?', 'Every colour is a token.']);
        // The reader's turn on one side, the answer on the other.
        expect(items()[0]!.classList.contains('vt-chat-message-own')).toBe(true);
        expect(items()[1]!.classList.contains('vt-chat-message-other')).toBe(true);
        // The name goes once a run, over the whole stack.
        expect(el.querySelector('.vt-chat-author')?.textContent).toBe('Vitral');
        await expectNoA11yViolations();
    });

    it('is one tab stop with the arrows moving inside it', () => {
        const { log, items } = mount();
        const tabbable = () => items().findIndex((m) => m.getAttribute('tabindex') === '0');
        expect(tabbable()).toBe(0);
        expect(items().filter((m) => m.getAttribute('tabindex') === '0')).toHaveLength(1);
        key(log(), 'ArrowDown');
        expect(tabbable()).toBe(1);
        key(log(), 'ArrowDown');
        // It stops at the end rather than wrapping: a thread has a bottom.
        expect(tabbable()).toBe(1);
        key(log(), 'Home');
        expect(tabbable()).toBe(0);
    });

    it('sends on Enter, breaks the line on Shift+Enter, and refuses an empty message', () => {
        const send = vi.fn();
        const { input, sendButton, chat } = mount({ draft: '', on: { send } });
        expect(sendButton().disabled).toBe(true);

        chat.update({ draft: 'Hello' });
        expect(sendButton().disabled).toBe(false);
        input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(send).toHaveBeenCalledWith({ text: 'Hello', attachments: [] });

        input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }));
        expect(send).toHaveBeenCalledTimes(1);

        // Whitespace is not a message.
        chat.update({ draft: '   ' });
        expect(sendButton().disabled).toBe(true);
    });

    it('shows a caret while an answer arrives, and announces it only once it settles', async () => {
        const { el, chat, status } = mount({ messages: [thread[0]!] });
        await settle();

        chat.update({ messages: [thread[0]!, { id: 2, role: 'assistant', content: 'Every', streaming: true }] });
        expect(el.querySelector('.vt-chat-caret')).not.toBeNull();
        // A live region that changed on every token would say nothing a screen
        // reader could follow, so a stream is not announced while it runs.
        await settle();
        expect(status()).toBe('');

        chat.update({ messages: [thread[0]!, { id: 2, role: 'assistant', content: 'Every colour is a token.', author: 'Vitral' }] });
        await settle();
        expect(el.querySelector('.vt-chat-caret')).toBeNull();
        expect(status()).toBe('Vitral: Every colour is a token.');
    });

    it('shows the steps an agent took, and what each one answered', async () => {
        const { el } = mount({
            variant: 'agent',
            messages: [{ id: 1, role: 'assistant', content: 'Found three.', toolCalls: [{ name: 'search_docs', input: 'theming', output: '3 results', status: 'done' }] }]
        });
        const tool = el.querySelector('.vt-chat-tool')!;
        expect(tool.querySelector('.vt-chat-tool-name')?.textContent).toBe('search_docs');
        expect(tool.querySelector('.vt-chat-tool-body')?.textContent).toBe('theming\n\n3 results');
        await expectNoA11yViolations();
    });

    it('offers the prompt starters while nothing has been said', () => {
        const suggestion = vi.fn();
        const { el } = mount({ messages: [], suggestions: ['What is a token?', 'Show me a chart'], on: { suggestion } });
        const buttons = [...el.querySelectorAll<HTMLButtonElement>('.vt-chat-suggestion')];
        expect(buttons.map((b) => b.textContent)).toEqual(['What is a token?', 'Show me a chart']);
        buttons[1]!.click();
        expect(suggestion).toHaveBeenCalledWith('Show me a chart');
        expect(el.querySelector('.vt-chat-empty')).not.toBeNull();
    });

    it('carries files in the composer and lets them be taken back out', () => {
        const detach = vi.fn();
        const { el, sendButton } = mount({ draft: '', allowAttachments: true, attachments: [{ name: 'notes.pdf', size: 2400 }], on: { detach } });
        const chip = el.querySelector('.vt-chat-composer .vt-chat-attachment')!;
        expect(chip.querySelector('.vt-chat-attachment-name')?.textContent).toBe('notes.pdf');
        expect(chip.querySelector('.vt-chat-attachment-size')?.textContent).toBe('2.4 kB');
        // A file on its own is a message, even with nothing typed.
        expect(sendButton().disabled).toBe(false);
        chip.querySelector<HTMLButtonElement>('.vt-chat-attachment-remove')!.click();
        expect(detach).toHaveBeenCalledWith({ name: 'notes.pdf', size: 2400 }, 0);
    });

    it('asks for an answer again when one failed', () => {
        const retry = vi.fn();
        const failed: ChatMessage = { id: 3, role: 'assistant', error: 'The model timed out.', retryable: true };
        const { el } = mount({ messages: [thread[0]!, failed], on: { retry } });
        const message = el.querySelectorAll('.vt-chat-message')[1]!;
        expect(message.classList.contains('vt-chat-message-error')).toBe(true);
        expect(message.querySelector('.vt-chat-bubble')?.textContent).toBe('The model timed out.');
        message.querySelector<HTMLButtonElement>('.vt-chat-retry')!.click();
        expect(retry).toHaveBeenCalledWith(failed);
    });

    it('opens the widget’s panel from its launcher and says so', () => {
        const openChange = vi.fn();
        const { el } = mount({ variant: 'widget', on: { 'open-change': openChange } });
        const launcher = el.querySelector<HTMLButtonElement>('.vt-chat-launcher')!;
        expect(el.classList.contains('vt-chat-widget-root')).toBe(true);
        expect(launcher.getAttribute('aria-expanded')).toBe('false');
        expect(el.querySelector('.vt-chat-panel')).toBeNull();
        launcher.click();
        expect(openChange).toHaveBeenCalledWith(true);
        expect(el.querySelector('.vt-chat-panel')).not.toBeNull();
        expect(el.querySelector<HTMLButtonElement>('.vt-chat-launcher')!.getAttribute('aria-expanded')).toBe('true');
    });

    it('drops its bubbles for a transcript, and its avatars for a side panel', () => {
        const captions = mount({ variant: 'captions' });
        expect(captions.el.classList.contains('vt-chat-captions')).toBe(true);
        expect(captions.el.querySelector('.vt-chat-avatar')).toBeNull();

        const copilot = mount({ variant: 'copilot' });
        expect(copilot.el.querySelector('.vt-chat-avatar')).toBeNull();
    });

    it('follows the locale, and leaves nothing behind when destroyed', () => {
        const { el, chat } = mount({ locale: ptBR, messages: [] });
        expect(el.querySelector<HTMLTextAreaElement>('.vt-chat-input')!.placeholder).toBe('Escreva uma mensagem');
        expect(el.querySelector('.vt-chat-empty')?.textContent).toContain('Nenhuma mensagem ainda');
        chat.destroy();
        expect(el.innerHTML).toBe('');
    });
});
