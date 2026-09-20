import type { ChatAttachment, ChatCitation, ChatMessage, ChatRole, ChatSendPayload, ChatToolCall, ChatVariant } from '@vitral/chat';
import type { BaseProps } from '../../base/types';

export type { ChatAttachment, ChatCitation, ChatMessage, ChatRole, ChatSendPayload, ChatToolCall, ChatVariant };

export interface ChatProps extends BaseProps {
    /** The thread. `v-model:messages` is not offered: what is said is the application's to decide. */
    messages?: ChatMessage[];
    variant?: ChatVariant;
    placeholder?: string;
    /** Prompt starters, shown while the thread is empty. */
    suggestions?: string[];
    emptyMessage?: string;
    /** `true` for the three dots, or the words to show instead. */
    typing?: boolean | string;
    disabled?: boolean;
    /** No composer at all: a transcript. */
    readonly?: boolean;
    allowAttachments?: boolean;
    accept?: string;
    /** Rows the composer grows to before it scrolls. Defaults to 6. */
    maxRows?: number;
    /** Enter sends and Shift+Enter breaks the line. False swaps them. */
    sendOnEnter?: boolean;
    /** Height of the thread's scroller. Defaults to `'28rem'`. */
    height?: string;
}

export interface ChatEmits {
    /** The composer was submitted. Add the message and answer it: the chat does not. */
    send: [payload: ChatSendPayload];
    retry: [message: ChatMessage];
    /** A prompt starter was pressed. */
    suggestion: [text: string];
    /** Files were chosen. Turn them into attachments and bind them to `v-model:attachments`. */
    attach: [files: File[]];
    /** The widget's panel opened or shut. */
    'open-change': [open: boolean];
    /** The reader left the newest message, or came back to it. */
    'at-bottom-change': [atBottom: boolean];
}

export interface ChatSlots {
    /** Over the thread: a title, a model picker, a close button. */
    header?: () => unknown;
    /** Under the composer: a disclaimer, a token count. */
    footer?: () => unknown;
    /** Replaces the whole of one message's body. */
    message?: (props: { message: ChatMessage; index: number }) => unknown;
    /** Replaces what is shown while nothing has been said. */
    empty?: () => unknown;
    /** The widget's launcher. */
    launcher?: (props: { open: boolean }) => unknown;
    /** The parts written as children. */
    default?: () => unknown;
}
