import { defineStyle } from '../defineStyle';
import css from './drawer.css?raw';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom' | 'full';

export interface DrawerState {
    position?: DrawerPosition;
    modal?: boolean;
}

export const drawerStyle = defineStyle({
    name: 'drawer',
    css,
    classes: {
        mask: (s: DrawerState) => ['vt-mask', 'vt-drawer-mask', `vt-drawer-mask-${s.position ?? 'left'}`, { 'vt-drawer-mask-modeless': s.modal === false }],
        root: (s: DrawerState) => ['vt-drawer', `vt-drawer-${s.position ?? 'left'}`],
        header: 'vt-drawer-header',
        title: 'vt-drawer-title',
        closeButton: 'vt-drawer-close-button',
        content: 'vt-drawer-content',
        footer: 'vt-drawer-footer'
    }
});
