import { defineStyle } from '../defineStyle';
import css from './menu.css?raw';

export interface MenuState {
    popup?: boolean;
}

export interface MenuItemState {
    disabled?: boolean;
    /** The item holds focus. Available to pass-through; the built-in look follows `:focus-visible`. */
    focused?: boolean;
}

export const menuStyle = defineStyle({
    name: 'menu',
    css,
    classes: {
        root: (s: MenuState) => (s.popup ? ['vt-overlay', 'vt-menu', 'vt-menu-overlay'] : ['vt-menu', 'vt-menu-inline']),
        start: 'vt-menu-start',
        list: 'vt-menu-list',
        group: 'vt-menu-group',
        groupList: 'vt-menu-group-list',
        submenuLabel: 'vt-menu-submenu-label',
        item: (s: MenuItemState) => ['vt-menu-item', { 'vt-menu-item-disabled': s.disabled }],
        itemContent: 'vt-menu-item-content',
        itemIcon: 'vt-menu-item-icon',
        itemLabel: 'vt-menu-item-label',
        separator: 'vt-menu-separator',
        end: 'vt-menu-end'
    }
});
