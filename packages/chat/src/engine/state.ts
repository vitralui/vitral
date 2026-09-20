import type { ChatMessage, ChatVariant } from './types';

/**
 * What to draw, worked out from what the chat was told. No DOM in it, so
 * another renderer — or a test — can use the same answers.
 */

/**
 * A run of messages from the same speaker, uninterrupted. The avatar and the
 * name are drawn once for the run rather than once a message, which is what
 * makes a thread read as speech instead of as a list.
 */
export interface ChatGroup {
    /** Where the run starts in `messages`. */
    start: number;
    messages: ChatMessage[];
}

/** Two messages belong to one run when the same speaker sent them both. */
export function groupMessages(messages: readonly ChatMessage[]): ChatGroup[] {
    const groups: ChatGroup[] = [];
    messages.forEach((message, index) => {
        const last = groups[groups.length - 1];
        const previous = last?.messages[last.messages.length - 1];
        // A system note never joins a run: it is about the conversation, not
        // part of it.
        const joins = previous && message.role !== 'system' && previous.role === message.role && (previous.author ?? '') === (message.author ?? '');
        if (joins) last!.messages.push(message);
        else groups.push({ start: index, messages: [message] });
    });
    return groups;
}

/** Which side a message sits on. A system note takes neither. */
export const sideOf = (role: ChatMessage['role']): 'own' | 'other' | 'none' => (role === 'user' ? 'own' : role === 'assistant' ? 'other' : 'none');

/** The initials to fall back to when a speaker has no picture. */
export function initialsOf(message: ChatMessage): string {
    if (message.initials) return message.initials;
    const name = message.author?.trim();
    if (!name) return message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI' : '';
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.length > 1 ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

/** A file's size in the units a person reads, or nothing when it is unknown. */
export function formatSize(bytes: number | undefined): string | undefined {
    if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return undefined;
    if (bytes < 1000) return `${bytes} B`;
    const units = ['kB', 'MB', 'GB', 'TB'];
    let value = bytes / 1000;
    let unit = 0;
    while (value >= 1000 && unit < units.length - 1) {
        value /= 1000;
        unit++;
    }
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/** Which variants draw an avatar beside a message. */
export const showsAvatars = (variant: ChatVariant): boolean => variant === 'basic' || variant === 'messenger' || variant === 'agent' || variant === 'widget';

/** Which variants put the words in a bubble rather than running them down the page. */
export const showsBubbles = (variant: ChatVariant): boolean => variant !== 'captions' && variant !== 'copilot';

/**
 * The message the tab stop belongs to after a key. The log is one tab stop and
 * the arrows move inside it, so a long thread does not bury the composer
 * behind a hundred tab presses.
 *
 * Returns the index to move to, or -1 when the key is not one of ours.
 */
export function messageKeyTarget(current: number, key: string, count: number): number {
    if (count === 0) return -1;
    const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));
    switch (key) {
        case 'ArrowDown':
            return clamp(current + 1);
        case 'ArrowUp':
            return clamp(current - 1);
        case 'Home':
            return 0;
        case 'End':
            return count - 1;
        case 'PageDown':
            return clamp(current + 5);
        case 'PageUp':
            return clamp(current - 5);
        default:
            return -1;
    }
}

/**
 * What a screen reader is told once a message settles. A streaming message is
 * announced when it stops, not while it grows: a live region that changes on
 * every token says nothing anyone can follow.
 */
export function announcementOf(message: ChatMessage | undefined, author: string): string {
    if (!message || message.streaming) return '';
    if (message.error) return `${author}: ${message.error}`;
    return message.content ? `${author}: ${message.content}` : '';
}
