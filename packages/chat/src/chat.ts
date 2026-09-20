import { en, isClient, loadStyle, type Locale } from '@vitral/core';
import { createRoot, h, iconNode, mergeAttrs, partResolver, type Child } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { baseStyle, chatStyle } from '@vitral/styles';
import { announcementOf, messageKeyTarget, showsAvatars } from './engine/state';
import type { ChatAttachment, ChatConfig, ChatMessage, ChatVariant } from './engine/types';
import { chatView, type ChatActions, type ViewContext } from './render/chat';

/**
 * A conversation with no framework in it: it is handed a configuration, it
 * draws the thread into the element it is given, and it reports what the
 * reader did.
 *
 * The log is one tab stop with a roving focus inside it — the arrows move a
 * message, Home and End jump — so a thread of two hundred messages does not
 * bury the composer behind two hundred tab presses. A message that is still
 * arriving grows in place with a caret after it and is announced only once it
 * settles, because a live region that changes on every token says nothing a
 * screen reader can follow.
 *
 * It scrolls to the newest message as messages arrive, but only while the
 * reader is already at the bottom: scrolling someone away from what they were
 * reading is the one thing an auto-scrolling log must never do. When they have
 * scrolled off, a button offers to take them back.
 */

export interface ChatHandle {
    element: HTMLElement;
    update(next: Partial<ChatConfig>): void;
    setLocale(locale: Locale): void;
    /** Puts the caret in the composer. */
    focus(): void;
    /** Moves the log to the newest message. */
    scrollToBottom(smooth?: boolean): void;
    /** Whether the reader is at the newest message. */
    atBottom(): boolean;
    destroy(): void;
}

let counter = 0;

export function createChat(element: HTMLElement, config: ChatConfig = {}): ChatHandle {
    let current: ChatConfig = { ...config };
    let destroyed = false;

    const id = current.id ?? `vt-chat-${++counter}`;
    const root = createRoot(element);
    const locale = (): Locale => current.locale ?? en;
    const part = partResolver({
        style: chatStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    if (!current.unstyled) {
        const options = { nonce: current.nonce, cssLayer: current.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(chatStyle.name, chatStyle.css, options);
    }

    // ---- what is on screen

    const messages = (): ChatMessage[] => current.messages ?? [];
    const variant = (): ChatVariant => current.variant ?? 'basic';

    let logEl: HTMLElement | null = null;
    let inputEl: HTMLTextAreaElement | null = null;
    let fileEl: HTMLInputElement | null = null;
    /** The message that holds the log's tab stop. */
    let tabIndex = 0;
    /** The reader has scrolled off the newest message. */
    let away = false;
    let announcement = '';
    /** The last message that had settled, so a stream is announced once it stops. */
    let announcedId: string | number | null = null;

    const emit = <K extends keyof NonNullable<ChatConfig['on']>>(name: K, ...args: Parameters<NonNullable<NonNullable<ChatConfig['on']>[K]>>) => {
        const handler = current.on?.[name] as ((...a: unknown[]) => void) | undefined;
        handler?.(...(args as unknown[]));
    };

    /** Within a few pixels of the end: a fractional scroll height must not read as "away". */
    const isAtBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight < 24;

    // ---- what the reader does

    function send() {
        if (current.disabled || current.readonly) return;
        const text = (current.draft ?? '').trim();
        const attachments = current.attachments ?? [];
        if (!text && attachments.length === 0) return;
        emit('send', { text, attachments });
    }

    const actions: ChatActions = {
        send,
        draft(text) {
            current = { ...current, draft: text };
            grow();
            emit('draft-change', text);
            render();
        },
        inputKeydown(event) {
            if (event.key !== 'Enter') return;
            // Enter sends and Shift+Enter breaks the line, unless the chat was
            // told otherwise — in which case the two swap over.
            const sends = current.sendOnEnter === false ? event.ctrlKey || event.metaKey : !event.shiftKey;
            if (!sends) return;
            event.preventDefault();
            send();
        },
        logKeydown(event) {
            const list = messages();
            const target = messageKeyTarget(tabIndex, event.key, list.length);
            if (target < 0 || target === tabIndex) return;
            event.preventDefault();
            tabIndex = target;
            render();
            focusTabbed();
        },
        focusMessage(index) {
            if (tabIndex === index) return;
            tabIndex = index;
            render();
        },
        retry(message) {
            emit('retry', message);
        },
        suggest(text) {
            emit('suggestion', text);
        },
        pickFiles() {
            fileEl?.click();
        },
        filesPicked(files) {
            if (files.length) emit('attach', files);
            // Cleared, or choosing the same file twice never fires again.
            if (fileEl) fileEl.value = '';
        },
        detach(attachment, index) {
            emit('detach', attachment, index);
        },
        scrolled(el) {
            const bottom = isAtBottom(el);
            if (bottom === !away) return;
            away = !bottom;
            emit('at-bottom-change', bottom);
            render();
        },
        jump() {
            handle.scrollToBottom(true);
        },
        toggleOpen() {
            const open = !current.open;
            current = { ...current, open };
            emit('open-change', open);
            render();
        }
    };

    /** The composer grows with what is typed, up to `maxRows`, and then scrolls. */
    function grow() {
        if (!inputEl) return;
        const max = current.maxRows ?? 6;
        inputEl.style.height = 'auto';
        const line = parseFloat(getComputedStyle(inputEl).lineHeight) || 20;
        const padding = inputEl.offsetHeight - inputEl.clientHeight + (parseFloat(getComputedStyle(inputEl).paddingTop) || 0) * 2;
        inputEl.style.height = `${Math.min(inputEl.scrollHeight, line * max + padding)}px`;
    }

    function focusTabbed() {
        if (!isClient) return;
        logEl?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    }

    // ---- drawing

    const context = (): ViewContext => ({
        config: current,
        locale: locale(),
        variant: variant(),
        messages: messages(),
        ids: { log: `${id}-log`, input: `${id}-input`, message: (index) => `${id}-m${index}` },
        part,
        tabIndex: Math.min(tabIndex, Math.max(0, messages().length - 1)),
        away,
        announcement,
        on: actions,
        refs: {
            log: (el) => (logEl = el as HTMLElement | null),
            input: (el) => (inputEl = el as HTMLTextAreaElement | null),
            file: (el) => (fileEl = el as HTMLInputElement | null)
        }
    });

    let drawing = false;
    function render() {
        if (destroyed || drawing) return;
        drawing = true;
        try {
            const drawn = context();
            const widget = variant() === 'widget';
            root.attrs(part(widget ? 'widget' : 'root', { variant: variant(), readonly: current.readonly, disabled: current.disabled }));
            root.render(widget ? widgetView(drawn) : chatView(drawn));
        } finally {
            drawing = false;
        }
    }

    /**
     * The widget: a launcher, and the thread in a panel that opens over the
     * page. The shell is the handle's rather than the view's, because it is the
     * handle that owns whether the panel is open.
     */
    function widgetView(drawn: ViewContext): Child[] {
        const open = !!current.open;
        const custom = current.slots?.launcher?.({ open });
        return [
            h(
                'button',
                mergeAttrs({ key: 'launcher', type: 'button' }, part('launcher'), {
                    'aria-expanded': open ? 'true' : 'false',
                    'aria-controls': `${id}-panel`,
                    'aria-label': open ? locale().chat.closeChat : locale().chat.openChat,
                    onClick: actions.toggleOpen
                }),
                custom !== null && custom !== undefined ? (custom as Child) : iconNode(getIcon(open ? 'x' : 'messageSquare'))
            ),
            open ? h('div', mergeAttrs({ key: 'panel', id: `${id}-panel` }, part('root', { variant: 'widget' }), part('panel')), ...chatView(drawn)) : null
        ];
    }

    // ---- what changed

    function afterUpdate(previous: ChatConfig) {
        const list = messages();
        const last = list[list.length - 1];

        // A message is announced once it has settled, not while it streams.
        if (last && !last.streaming && last.id !== announcedId) {
            announcedId = last.id;
            const author = last.author ?? (last.role === 'user' ? locale().chat.message : (current.ariaLabel ?? locale().chat.conversation));
            const words = announcementOf(last, author);
            if (words) {
                announcement = '';
                render();
                Promise.resolve().then(() => {
                    if (destroyed) return;
                    announcement = words;
                    render();
                });
            }
        }

        // Follow the newest message, but only for a reader who was already there.
        const grew = list.length > (previous.messages?.length ?? 0);
        const streaming = !!last?.streaming;
        if ((grew || streaming) && !away) queueMicrotask(() => handle.scrollToBottom());
    }

    const handle: ChatHandle = {
        element,
        update(next) {
            if (destroyed) return;
            const previous = current;
            current = { ...current, ...next };
            // A thread that got shorter must not keep a tab stop past its end.
            tabIndex = Math.min(tabIndex, Math.max(0, messages().length - 1));
            render();
            grow();
            afterUpdate(previous);
        },
        setLocale(next) {
            handle.update({ locale: next });
        },
        focus() {
            inputEl?.focus();
        },
        scrollToBottom(smooth = false) {
            if (!logEl) return;
            // `scrollTo` with options is not everywhere — jsdom has no scrollTo
            // on an element at all — and this runs from a microtask, where a
            // throw goes unhandled and takes the next render with it.
            if (typeof logEl.scrollTo === 'function') logEl.scrollTo({ top: logEl.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
            else logEl.scrollTop = logEl.scrollHeight;
            if (away) {
                away = false;
                emit('at-bottom-change', true);
                render();
            }
        },
        atBottom: () => !away,
        destroy() {
            if (destroyed) return;
            destroyed = true;
            root.clear();
            logEl = null;
            inputEl = null;
            fileEl = null;
        }
    };

    render();
    // The thread opens at its newest message, which is where a conversation is read from.
    queueMicrotask(() => {
        if (!destroyed) handle.scrollToBottom();
    });
    return handle;
}
