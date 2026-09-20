import type { Locale } from '@vitral/core';
import type { OverlayTarget } from '@vitral/controls';
import type { ClassEntry } from '@vitral/styles';
import type { PassThrough } from '@vitral/dom';

/** Anything a renderer can be handed for a slot: a string, a node, nothing. */
export type Content = string | Node | null | undefined;

/**
 * Who said it. `system` is the note that is neither side of the conversation —
 * a topic change, a model swap, the day turning over.
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * What the chat is for, which decides its shape rather than its colours:
 *
 * - `basic`: the plain thread, for a page that is the conversation.
 * - `messenger`: two people, so both sides get a bubble and an avatar.
 * - `copilot`: a narrow column beside the work; no avatars, tighter rows.
 * - `agent`: an assistant that uses tools, so the steps it took are shown.
 * - `widget`: a launcher and a panel that opens over the page.
 * - `captions`: a running transcript — no bubbles, the newest at the bottom,
 *   for speech as it is recognised.
 */
export type ChatVariant = 'basic' | 'messenger' | 'copilot' | 'agent' | 'widget' | 'captions';

export interface ChatAttachment {
    id?: string | number;
    name: string;
    /** Bytes. Shown beside the name when it is known. */
    size?: number;
    /** A media type, for the icon. */
    type?: string;
    url?: string;
}

/**
 * A tool the assistant reached for. `status` is what to draw: still running,
 * finished, or failed — which is the whole reason to show the step at all.
 */
export interface ChatToolCall {
    id?: string | number;
    name: string;
    /** What it was asked and what it answered, as text. */
    input?: string;
    output?: string;
    status?: 'running' | 'done' | 'error';
}

/** Where an answer got something, shown under it. */
export interface ChatCitation {
    title: string;
    url?: string;
}

export interface ChatMessage {
    id: string | number;
    role: ChatRole;
    content?: string;
    /** A name beside the avatar, when the role does not say enough. */
    author?: string;
    /** An image for the avatar; `initials` stands in without one. */
    avatar?: string;
    initials?: string;
    at?: Date | string | number;
    /**
     * Still arriving. The message grows in place, a caret follows the last
     * character, and the log announces it once it settles rather than on every
     * token — a screen reader cannot follow a stream and should not try.
     */
    streaming?: boolean;
    /** What went wrong, shown in the message's place. */
    error?: string;
    /** The reader can ask for this one again. */
    retryable?: boolean;
    attachments?: ChatAttachment[];
    toolCalls?: ChatToolCall[];
    citations?: ChatCitation[];
}

export interface ChatSendPayload {
    text: string;
    attachments: ChatAttachment[];
}

export interface ChatEvents {
    /** The composer was submitted. The message is not added for you: add it and answer it. */
    send?: (payload: ChatSendPayload) => void;
    /** The composer's text changed. */
    'draft-change'?: (text: string) => void;
    /** A message's retry button was pressed. */
    retry?: (message: ChatMessage) => void;
    /** A prompt starter was pressed. Sent as well, unless `preventSend` is called. */
    suggestion?: (text: string) => void;
    /** Files were chosen. Turn them into attachments and hand them back through `attachments`. */
    attach?: (files: File[]) => void;
    /** An attachment in the composer was removed. */
    detach?: (attachment: ChatAttachment, index: number) => void;
    /** The widget's panel opened or shut. */
    'open-change'?: (open: boolean) => void;
    /** The reader scrolled away from the newest message, or came back to it. */
    'at-bottom-change'?: (atBottom: boolean) => void;
}

export interface ChatSlots {
    /** Over the thread: a title, a model picker, a close button. */
    header?: () => Content;
    /** Under the composer: a disclaimer, a token count. */
    footer?: () => Content;
    /** Replaces the whole of one message's body. */
    message?: (context: { message: ChatMessage; index: number }) => Content;
    /** Replaces what is shown when there are no messages. */
    empty?: () => Content;
    /** The widget's launcher. */
    launcher?: (context: { open: boolean }) => Content;
}

export interface ChatConfig {
    messages?: ChatMessage[];
    /** What the composer holds. Give it back on `draft-change` to control it. */
    draft?: string;
    variant?: ChatVariant;
    /** Named for a screen reader; the header's words are not always the name. */
    ariaLabel?: string;
    placeholder?: string;
    /** Prompt starters, shown while the thread is empty. */
    suggestions?: string[];
    emptyMessage?: string;
    /**
     * Someone is composing a reply: `true` for the plain three dots, or the
     * words to show instead ("Searching the docs…").
     */
    typing?: boolean | string;
    /** The composer is there but cannot be used. */
    disabled?: boolean;
    /** No composer at all: a transcript. */
    readonly?: boolean;
    /** Show the paperclip. */
    allowAttachments?: boolean;
    /** An `accept` for the file input. */
    accept?: string;
    /** Attachments waiting in the composer. */
    attachments?: ChatAttachment[];
    /** Rows the composer grows to before it scrolls. Defaults to 6. */
    maxRows?: number;
    /** Enter sends and Shift+Enter breaks the line. False swaps them. */
    sendOnEnter?: boolean;
    /** The widget's panel. */
    open?: boolean;
    /**
     * Where the widget's panel is put. It is taken out of the page and hung
     * from the launcher, because a panel that opens over the page cannot live
     * inside whatever box the launcher was dropped into — the first container
     * with a scrollbar or a hidden overflow would cut it in half.
     */
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    /** Height of the thread's scroller. Defaults to `'28rem'`. */
    height?: string;
    locale?: Locale;
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    nonce?: string;
    cssLayer?: string | false;
    id?: string;
    on?: ChatEvents;
    slots?: ChatSlots;
}
