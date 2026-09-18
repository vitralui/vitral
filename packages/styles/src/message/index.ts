import { defineStyle } from '../defineStyle';
import css from './message.css?raw';

export interface MessageState {
    severity?: string;
    variant?: 'subtle' | 'outlined' | 'simple';
}

export const messageStyle = defineStyle({
    name: 'message',
    css,
    classes: {
        root: (s: MessageState) => ['vt-message', s.severity && s.severity !== 'info' && `vt-message-${s.severity}`, s.variant && s.variant !== 'subtle' && `vt-message-${s.variant}`],
        content: 'vt-message-content',
        icon: 'vt-message-icon',
        body: 'vt-message-body',
        title: 'vt-message-title',
        text: 'vt-message-text',
        action: 'vt-message-action',
        closeButton: 'vt-message-close-button'
    }
});
