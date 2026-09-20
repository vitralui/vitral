import { definePart } from '../../base/parts';

/**
 * The chat's content, written as children rather than as named slots:
 * `<Chat.Header>`, `<Chat.Empty>`. Each draws nothing itself — the chat takes
 * what is inside it and places it where that part belongs. The named slots do
 * the same thing and win where a template gives both.
 */
export const ChatHeader = definePart('Header', 'VtChatHeader');
export const ChatFooter = definePart('Footer', 'VtChatFooter');
export const ChatEmpty = definePart('Empty', 'VtChatEmpty');
export const ChatLauncher = definePart('Launcher', 'VtChatLauncher');
