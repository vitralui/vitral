import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Chat from './Chat.vue';
import type { ChatMessage, ChatSendPayload } from './types';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const thread: ChatMessage[] = [
    { id: 1, role: 'user', content: 'Is this themeable?' },
    { id: 2, role: 'assistant', content: 'Every colour is a token.', author: 'Vitral' }
];

function mountChat(props: Record<string, unknown> = {}, slots?: Record<string, unknown>) {
    const draft = ref('');
    const sent: ChatSendPayload[] = [];
    mountVt(
        defineComponent(() => () =>
            h(
                Chat,
                {
                    messages: thread,
                    'aria-label': 'Support',
                    ...props,
                    draft: draft.value,
                    'onUpdate:draft': (v: string) => (draft.value = v),
                    onSend: (p: ChatSendPayload) => sent.push(p)
                },
                slots
            )
        )
    );
    const input = () => document.querySelector<HTMLTextAreaElement>('.vt-chat-input')!;
    const items = () => [...document.querySelectorAll<HTMLElement>('.vt-chat-message')];
    return { draft, sent, input, items };
}

describe('Chat', () => {
    it('draws the thread the addon draws, and takes the label for the log', async () => {
        const { items } = mountChat();
        await settle();
        expect(document.querySelector('.vt-chat-log')!.getAttribute('aria-label')).toBe('Support');
        expect(items().map((m) => m.querySelector('.vt-chat-bubble')?.textContent)).toEqual(['Is this themeable?', 'Every colour is a token.']);
        await expectNoA11yViolations();
    });

    it('binds the composer through v-model:draft and hands a send back to the application', async () => {
        const { draft, sent, input } = mountChat();
        await settle();
        input().value = 'How?';
        input().dispatchEvent(new Event('input', { bubbles: true }));
        await nextTick();
        expect(draft.value).toBe('How?');

        input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        // The chat does not add the message: what is said is the application's to decide.
        expect(sent).toEqual([{ text: 'How?', attachments: [] }]);
        expect(document.querySelectorAll('.vt-chat-message')).toHaveLength(2);
    });

    it('lets a template replace a message and place the parts written as children', async () => {
        mountChat({ messages: [thread[0]!] }, {
            message: ({ message }: { message: ChatMessage }) => [h('b', { class: 'mine' }, String(message.content).toUpperCase())],
            header: () => [h('span', { class: 'head' }, 'Support')]
        });
        await settle();
        expect(document.querySelector('.mine')?.textContent).toBe('IS THIS THEMEABLE?');
        expect(document.querySelector('.vt-chat-header .head')?.textContent).toBe('Support');
    });

    it('opens the widget through v-model:open', async () => {
        const openChange = vi.fn();
        const open = ref(false);
        mountVt(
            defineComponent(() => () =>
                h(Chat, {
                    messages: thread,
                    variant: 'widget',
                    'aria-label': 'Support',
                    open: open.value,
                    'onUpdate:open': (v: boolean) => (open.value = v),
                    'onOpenChange': openChange
                })
            )
        );
        await settle();
        expect(document.querySelector('.vt-chat-panel')).toBeNull();
        document.querySelector<HTMLButtonElement>('.vt-chat-launcher')!.click();
        await nextTick();
        expect(open.value).toBe(true);
        expect(openChange).toHaveBeenCalledWith(true);
        expect(document.querySelector('.vt-chat-panel')).not.toBeNull();
    });
});
