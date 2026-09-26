import { defineStyle } from '../defineStyle';
import css from './dialog.css?raw';

export type DialogPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DialogMaskState {
    position?: DialogPosition;
    modal?: boolean;
    maximized?: boolean;
}

export interface DialogState {
    maximized?: boolean;
    /** Being moved by its header. */
    dragging?: boolean;
}

export interface DialogHeaderState {
    /** The header moves the dialog. */
    draggable?: boolean;
}

export const dialogStyle = defineStyle({
    name: 'dialog',
    css,
    classes: {
        mask: (s: DialogMaskState) => [
            'vt-mask',
            'vt-dialog-mask',
            s.position && s.position !== 'center' && `vt-dialog-mask-${s.position}`,
            { 'vt-dialog-mask-modeless': s.modal === false, 'vt-dialog-mask-maximized': s.maximized }
        ],
        root: (s: DialogState) => ['vt-dialog', { 'vt-dialog-maximized': s.maximized, 'vt-dialog-dragging': s.dragging }],
        header: (s: DialogHeaderState) => ['vt-dialog-header', { 'vt-dialog-header-draggable': s.draggable }],
        title: 'vt-dialog-title',
        headerActions: 'vt-dialog-header-actions',
        maximizeButton: 'vt-dialog-header-button vt-dialog-maximize-button',
        closeButton: 'vt-dialog-header-button vt-dialog-close-button',
        content: 'vt-dialog-content',
        footer: 'vt-dialog-footer'
    }
});
