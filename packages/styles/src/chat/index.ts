import { defineStyle } from '../defineStyle';
import css from './chat.css?raw';

export interface ChatRootState {
    variant?: string;
    readonly?: boolean;
    disabled?: boolean;
}

export const chatStyle = defineStyle({
    name: 'chat',
    css,
    classes: {
        root: (s: ChatRootState) => ['vt-chat', s.variant && `vt-chat-${s.variant}`, { 'vt-chat-readonly': s.readonly, 'vt-chat-disabled': s.disabled }],
        /** The wrapper the widget's launcher and panel share. */
        widget: 'vt-chat-widget-root',
        launcher: 'vt-chat-launcher',
        panel: 'vt-chat-panel',
        header: 'vt-chat-header',
        footer: 'vt-chat-footer',
        log: 'vt-chat-log',
        group: (s: { side?: string }) => ['vt-chat-group', s.side && `vt-chat-group-${s.side}`],
        stack: 'vt-chat-stack',
        avatar: (s: { spacer?: boolean }) => ['vt-chat-avatar', { 'vt-chat-avatar-spacer': s.spacer }],
        author: 'vt-chat-author',
        message: (s: { side?: string; role?: string; error?: boolean; streaming?: boolean }) => [
            'vt-chat-message',
            s.side && `vt-chat-message-${s.side}`,
            s.role && `vt-chat-message-${s.role}`,
            { 'vt-chat-message-error': s.error, 'vt-chat-message-streaming': s.streaming }
        ],
        bubble: 'vt-chat-bubble',
        caret: 'vt-chat-caret',
        meta: 'vt-chat-meta',
        time: 'vt-chat-time',
        retry: 'vt-chat-retry',
        tools: 'vt-chat-tools',
        tool: 'vt-chat-tool',
        toolSummary: 'vt-chat-tool-summary',
        toolName: 'vt-chat-tool-name',
        toolStatus: (s: { status?: string }) => ['vt-chat-tool-status', s.status && `vt-chat-tool-status-${s.status}`],
        toolBody: 'vt-chat-tool-body',
        attachments: 'vt-chat-attachments',
        attachment: 'vt-chat-attachment',
        attachmentName: 'vt-chat-attachment-name',
        attachmentSize: 'vt-chat-attachment-size',
        attachmentRemove: 'vt-chat-attachment-remove',
        citations: 'vt-chat-citations',
        citation: 'vt-chat-citation',
        typing: 'vt-chat-typing',
        typingDots: 'vt-chat-typing-dots',
        empty: 'vt-chat-empty',
        suggestions: 'vt-chat-suggestions',
        suggestion: 'vt-chat-suggestion',
        jump: 'vt-chat-jump',
        composer: 'vt-chat-composer',
        composerRow: 'vt-chat-composer-row',
        input: 'vt-chat-input',
        attach: () => ['vt-chat-action', 'vt-chat-attach'],
        send: () => ['vt-chat-action', 'vt-chat-send'],
        file: 'vt-chat-file',
        status: 'vt-sr-only'
    }
});
