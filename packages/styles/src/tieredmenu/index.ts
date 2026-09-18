import { defineStyle } from '../defineStyle';
import css from './tieredmenu.css?raw';

export interface NestedMenuItemState {
    disabled?: boolean;
    /** The item holds focus. Available to pass-through; the built-in look follows `:focus-visible`. */
    focused?: boolean;
    /** Its submenu is open. */
    active?: boolean;
    level?: number;
    /** It opens a submenu. */
    parent?: boolean;
}

/** The parts every nested menu shares — TieredMenu, ContextMenu, Menubar — under one component's class prefix. */
export function nestedMenuClasses(prefix: string) {
    return {
        rootList: `${prefix}-root-list`,
        submenu: `${prefix}-submenu`,
        item: (s: NestedMenuItemState) => [`${prefix}-item`, { [`${prefix}-item-disabled`]: s.disabled, [`${prefix}-item-active`]: s.active }],
        itemContent: `${prefix}-item-content`,
        itemIcon: `${prefix}-item-icon`,
        itemLabel: `${prefix}-item-label`,
        submenuIcon: `${prefix}-submenu-icon`,
        separator: `${prefix}-separator`
    };
}

export const tieredmenuStyle = defineStyle({
    name: 'tieredmenu',
    css,
    classes: {
        root: (s: { popup?: boolean }) => (s.popup ? ['vt-overlay', 'vt-tieredmenu', 'vt-tieredmenu-overlay'] : ['vt-tieredmenu', 'vt-tieredmenu-inline']),
        start: 'vt-tieredmenu-start',
        end: 'vt-tieredmenu-end',
        ...nestedMenuClasses('vt-tieredmenu')
    }
});
