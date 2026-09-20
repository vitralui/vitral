import { formatMessage, type Locale } from '@vitral/core';
import { h, iconNode, mergeAttrs, type Child, type Props } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { formatSize, groupMessages, initialsOf, showsAvatars, sideOf, type ChatGroup } from '../engine/state';
import type { ChatAttachment, ChatConfig, ChatMessage, ChatToolCall, ChatVariant, Content } from '../engine/types';

/**
 * The conversation as plain objects: a scrolling log of runs of messages and
 * the box that adds to it. What is drawn is decided here; what happens when it
 * is pressed is the handle's.
 */

const icon = (name: string, props?: Props): Child => iconNode(getIcon(name), props);
const content = (value: Content): Child => (value === null || value === undefined ? null : value);

export interface ChatActions {
    send: () => void;
    draft: (text: string) => void;
    inputKeydown: (event: KeyboardEvent) => void;
    logKeydown: (event: KeyboardEvent) => void;
    focusMessage: (index: number) => void;
    retry: (message: ChatMessage) => void;
    suggest: (text: string) => void;
    pickFiles: () => void;
    filesPicked: (files: File[]) => void;
    detach: (attachment: ChatAttachment, index: number) => void;
    scrolled: (element: HTMLElement) => void;
    jump: () => void;
    toggleOpen: () => void;
}

export interface ViewContext {
    config: ChatConfig;
    locale: Locale;
    variant: ChatVariant;
    messages: ChatMessage[];
    ids: { log: string; input: string; message: (index: number) => string };
    part: (name: string, state?: unknown) => Props;
    /** The message that holds the log's tab stop. */
    tabIndex: number;
    /** The reader has scrolled away from the newest message. */
    away: boolean;
    announcement: string;
    on: ChatActions;
    /** Keeps the log and the composer reachable from the handle. */
    refs: { log: (el: Element | null) => void; input: (el: Element | null) => void; file: (el: Element | null) => void };
}

/** The time a message carries, in the reader's own format. */
function timeText(at: ChatMessage['at'], locale: Locale): string | undefined {
    if (at === undefined || at === null) return undefined;
    const date = at instanceof Date ? at : new Date(at);
    if (Number.isNaN(date.getTime())) return undefined;
    return new Intl.DateTimeFormat(locale.code, { hour: '2-digit', minute: '2-digit' }).format(date);
}

function attachmentView(context: ViewContext, attachment: ChatAttachment, index: number, removable: boolean): Child {
    const { part, on, locale } = context;
    const size = formatSize(attachment.size);
    const body: Child[] = [
        icon('paperclip'),
        h('span', part('attachmentName'), attachment.name),
        size ? h('span', part('attachmentSize'), size) : null,
        removable
            ? h(
                  'button',
                  mergeAttrs({ type: 'button' }, part('attachmentRemove'), {
                      'aria-label': formatMessage(locale.chat.removeAttachment, { name: attachment.name }),
                      onClick: () => on.detach(attachment, index)
                  }),
                  icon('x')
              )
            : null
    ];
    // A file that has somewhere to go is a link; one that has not is a chip.
    return attachment.url && !removable
        ? h('a', mergeAttrs({ key: `a${index}`, href: attachment.url, target: '_blank', rel: 'noreferrer' }, part('attachment')), ...body)
        : h('span', mergeAttrs({ key: `a${index}` }, part('attachment')), ...body);
}

function toolView(context: ViewContext, tool: ChatToolCall, index: number): Child {
    const { part, locale } = context;
    const status = tool.status ?? 'done';
    const words = status === 'running' ? locale.chat.toolRunning : status === 'error' ? locale.chat.toolFailed : locale.chat.toolDone;
    const detail = [tool.input, tool.output].filter(Boolean).join('\n\n');
    return h(
        'details',
        mergeAttrs({ key: `t${index}` }, part('tool')),
        h(
            'summary',
            part('toolSummary'),
            icon(status === 'running' ? 'spinner' : status === 'error' ? 'warning' : 'check', status === 'running' ? { spin: true } : undefined),
            h('span', part('toolName'), tool.name),
            h('span', part('toolStatus', { status }), words)
        ),
        detail ? h('pre', part('toolBody'), detail) : null
    );
}

function messageView(context: ViewContext, message: ChatMessage, index: number): Child {
    const { part, locale, on, config, ids, tabIndex } = context;
    const side = sideOf(message.role);
    const custom = config.slots?.message?.({ message, index });
    const time = timeText(message.at, locale);
    const body = message.error ?? message.content ?? '';

    return h(
        'div',
        mergeAttrs({ key: String(message.id), id: ids.message(index) }, part('message', { side, role: message.role, error: !!message.error, streaming: !!message.streaming }), {
            role: 'listitem',
            // One tab stop for the whole log; the arrows move within it, so a
            // long thread does not bury the composer behind a hundred tabs.
            tabindex: index === tabIndex ? 0 : -1,
            onFocus: () => on.focusMessage(index)
        }),
        custom !== null && custom !== undefined
            ? content(custom)
            : [
                  message.toolCalls?.length ? h('div', mergeAttrs({ key: 'tools' }, part('tools')), ...message.toolCalls.map((tool, i) => toolView(context, tool, i))) : null,
                  body || message.streaming
                      ? h(
                            'div',
                            mergeAttrs({ key: 'bubble' }, part('bubble')),
                            body,
                            // The caret follows the last character while the answer arrives.
                            message.streaming ? h('span', mergeAttrs({ key: 'caret', 'aria-hidden': 'true' }, part('caret'))) : null
                        )
                      : null,
                  message.attachments?.length
                      ? h('div', mergeAttrs({ key: 'files' }, part('attachments')), ...message.attachments.map((a, i) => attachmentView(context, a, i, false)))
                      : null,
                  message.citations?.length
                      ? h(
                            'div',
                            mergeAttrs({ key: 'cites' }, part('citations')),
                            ...message.citations.map((c, i) =>
                                c.url
                                    ? h('a', mergeAttrs({ key: `c${i}`, href: c.url, target: '_blank', rel: 'noreferrer' }, part('citation')), `${i + 1}. ${c.title}`)
                                    : h('span', mergeAttrs({ key: `c${i}` }, part('citation')), `${i + 1}. ${c.title}`)
                            )
                        )
                      : null,
                  time || message.retryable
                      ? h(
                            'div',
                            mergeAttrs({ key: 'meta' }, part('meta')),
                            time ? h('time', part('time'), time) : null,
                            message.retryable
                                ? h('button', mergeAttrs({ type: 'button' }, part('retry'), { onClick: () => on.retry(message) }), icon('refresh'), locale.chat.retry)
                                : null
                        )
                      : null
              ]
    );
}

function groupView(context: ViewContext, group: ChatGroup): Child {
    const { part, variant } = context;
    const first = group.messages[0]!;
    const side = sideOf(first.role);
    const withAvatar = showsAvatars(variant) && first.role !== 'system';
    const author = first.author ?? (first.role === 'assistant' ? context.config.ariaLabel : undefined);

    return h(
        'div',
        mergeAttrs({ key: `g${group.start}` }, part('group', { side })),
        withAvatar
            ? h(
                  'span',
                  mergeAttrs({ key: 'avatar', 'aria-hidden': 'true' }, part('avatar', {})),
                  first.avatar ? h('img', { src: first.avatar, alt: '' }) : initialsOf(first)
              )
            : null,
        h(
            'div',
            mergeAttrs({ key: 'stack' }, part('stack')),
            // The name goes once a run, not once a message: that is what makes
            // a thread read as speech instead of as a list.
            author && first.role !== 'system' ? h('span', mergeAttrs({ key: 'author' }, part('author')), author) : null,
            ...group.messages.map((message, i) => messageView(context, message, group.start + i))
        )
    );
}

function emptyView(context: ViewContext): Child {
    const { part, config, locale, on } = context;
    const custom = config.slots?.empty?.();
    if (custom !== null && custom !== undefined) return h('div', mergeAttrs({ key: 'empty' }, part('empty')), content(custom));
    const suggestions = config.suggestions ?? [];
    return h(
        'div',
        mergeAttrs({ key: 'empty' }, part('empty')),
        h('p', { key: 'text' }, config.emptyMessage ?? locale.chat.empty),
        suggestions.length
            ? h(
                  'div',
                  mergeAttrs({ key: 'suggestions' }, part('suggestions')),
                  ...suggestions.map((text, i) => h('button', mergeAttrs({ key: `s${i}`, type: 'button' }, part('suggestion'), { onClick: () => on.suggest(text) }), text))
              )
            : null
    );
}

function typingView(context: ViewContext): Child {
    const { part, config, locale } = context;
    if (!config.typing) return null;
    const words = typeof config.typing === 'string' ? config.typing : locale.chat.typing;
    return h(
        'div',
        mergeAttrs({ key: 'typing' }, part('typing')),
        h('span', mergeAttrs({ key: 'dots', 'aria-hidden': 'true' }, part('typingDots')), h('span'), h('span'), h('span')),
        words
    );
}

function composerView(context: ViewContext): Child {
    const { part, config, locale, on, ids, refs } = context;
    if (config.readonly) return null;
    const attachments = config.attachments ?? [];
    const empty = !(config.draft ?? '').trim() && attachments.length === 0;
    return h(
        'div',
        mergeAttrs({ key: 'composer' }, part('composer')),
        attachments.length ? h('div', mergeAttrs({ key: 'staged' }, part('attachments')), ...attachments.map((a, i) => attachmentView(context, a, i, true))) : null,
        h(
            'div',
            mergeAttrs({ key: 'row' }, part('composerRow')),
            config.allowAttachments
                ? [
                      h('input', mergeAttrs({ key: 'file', type: 'file', multiple: true, accept: config.accept }, part('file'), {
                          ref: refs.file,
                          onChange: (event: Event) => on.filesPicked(Array.from((event.target as HTMLInputElement).files ?? []))
                      })),
                      h('button', mergeAttrs({ key: 'attach', type: 'button' }, part('attach'), { 'aria-label': locale.chat.attach, disabled: config.disabled, onClick: on.pickFiles }), icon('paperclip'))
                  ]
                : null,
            h('textarea', mergeAttrs({ key: 'input', id: ids.input }, part('input'), {
                ref: refs.input,
                rows: 1,
                value: config.draft ?? '',
                placeholder: config.placeholder ?? locale.chat.placeholder,
                disabled: config.disabled,
                'aria-label': locale.chat.message,
                'aria-controls': ids.log,
                onInput: (event: Event) => on.draft((event.target as HTMLTextAreaElement).value),
                onKeydown: on.inputKeydown
            })),
            h('button', mergeAttrs({ key: 'send', type: 'button' }, part('send'), { 'aria-label': locale.chat.send, disabled: config.disabled || empty, onClick: on.send }), icon('send'))
        )
    );
}

/** The thread: the header, the log, the composer — everything but the widget's shell. */
export function chatView(context: ViewContext): Child[] {
    const { part, config, locale, messages, ids, on, refs, away, announcement } = context;
    const header = config.slots?.header?.();
    const footer = config.slots?.footer?.();
    const groups = groupMessages(messages);

    return [
        header !== null && header !== undefined ? h('div', mergeAttrs({ key: 'header' }, part('header')), content(header)) : null,
        h(
            'div',
            mergeAttrs({ key: 'log', id: ids.log }, part('log'), {
                ref: refs.log,
                role: 'list',
                'aria-label': config.ariaLabel ?? locale.chat.conversation,
                tabindex: messages.length ? -1 : 0,
                style: config.height ? { height: config.height } : undefined,
                onKeydown: on.logKeydown,
                onScroll: (event: Event) => on.scrolled(event.target as HTMLElement)
            }),
            messages.length ? groups.map((group) => groupView(context, group)) : emptyView(context),
            typingView(context)
        ),
        // Going back to the newest message when the reader has scrolled off it,
        // which is the one thing an auto-scrolling log must never do for them.
        away && messages.length
            ? h('button', mergeAttrs({ key: 'jump', type: 'button' }, part('jump'), { onClick: on.jump }), icon('chevronDown'), locale.chat.newest)
            : null,
        composerView(context),
        footer !== null && footer !== undefined ? h('div', mergeAttrs({ key: 'footer' }, part('footer')), content(footer)) : null,
        // A message is announced once it has settled: a live region that changes
        // on every token of a stream says nothing anyone can follow.
        h('div', mergeAttrs({ key: 'status', role: 'status', 'aria-live': 'polite' }, part('status')), announcement)
    ];
}
