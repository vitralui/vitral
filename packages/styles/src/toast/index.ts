import { defineStyle } from '../defineStyle';
import css from './toast.css?raw';

export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center';

export interface ToastState {
    position?: ToastPosition;
    stacked?: boolean;
    expanded?: boolean;
}

export interface ToastMessageState {
    severity?: string;
    pinned?: boolean;
}

export const toastStyle = defineStyle({
    name: 'toast',
    css,
    classes: {
        root: (s: ToastState) => ['vt-toast', `vt-toast-${s.position ?? 'top-right'}`, { 'vt-toast-stacked': s.stacked, 'vt-toast-expanded': s.expanded }],
        message: (s: ToastMessageState) => ['vt-toast-message', s.severity && `vt-toast-message-${s.severity}`, { 'vt-toast-message-pinned': s.pinned }],
        messageContent: 'vt-toast-message-content',
        messageIcon: 'vt-toast-message-icon',
        messageText: 'vt-toast-message-text',
        summary: 'vt-toast-summary',
        detail: 'vt-toast-detail',
        count: 'vt-toast-count',
        actions: 'vt-toast-actions',
        actionButton: 'vt-toast-action-button',
        progress: 'vt-toast-progress',
        closeButton: 'vt-toast-close-button'
    }
});
