import { defineStyle } from '../defineStyle';
import css from './megamenu.css?raw';

export interface MegaMenuItemState {
    disabled?: boolean;
    active?: boolean;
    focused?: boolean;
    root?: boolean;
}

export const megamenuStyle = defineStyle({
    name: 'megamenu',
    css,
    classes: {
        root: (s: { orientation?: string }) => ['vt-megamenu', { 'vt-megamenu-vertical': s.orientation === 'vertical' }],
        start: 'vt-megamenu-start',
        end: 'vt-megamenu-end',
        rootList: 'vt-megamenu-root-list',
        item: (s: MegaMenuItemState) => ['vt-megamenu-item', { 'vt-megamenu-root-item': s.root, 'vt-megamenu-item-disabled': s.disabled, 'vt-megamenu-item-active': s.active }],
        itemContent: 'vt-megamenu-item-content',
        itemIcon: 'vt-megamenu-item-icon',
        itemLabel: 'vt-megamenu-item-label',
        submenuIcon: 'vt-megamenu-submenu-icon',
        panel: 'vt-megamenu-panel',
        column: 'vt-megamenu-column',
        group: 'vt-megamenu-group',
        groupLabel: 'vt-megamenu-group-label'
    }
});
