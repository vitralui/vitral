import { defineStyle } from '../defineStyle';
import css from './toast.css?raw';

export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center';

export interface ToastState {
    position?: ToastPosition;
}

export interface ToastMessageState {
    severity?: string;
}

export const toastStyle = defineStyle({
    name: 'toast',
    css,
    classes: {
        root: (s: ToastState) => ['vt-toast', `vt-toast-${s.position ?? 'top-right'}`],
        message: (s: ToastMessageState) => ['vt-toast-message', s.severity && `vt-toast-message-${s.severity}`],
        messageContent: 'vt-toast-message-content',
        messageIcon: 'vt-toast-message-icon',
        messageText: 'vt-toast-message-text',
        summary: 'vt-toast-summary',
        detail: 'vt-toast-detail',
        closeButton: 'vt-toast-close-button'
    }
});
