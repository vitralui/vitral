import { defineStyle } from '../defineStyle';
import css from './sidebar.css?raw';

export interface SidebarState {
    collapsed?: boolean;
    side?: 'left' | 'right';
    offcanvas?: boolean;
    inDrawer?: boolean;
}

export const sidebarStyle = defineStyle({
    name: 'sidebar',
    css,
    classes: {
        root: (s: SidebarState) => [
            'vt-sidebar',
            { 'vt-sidebar-right': s.side === 'right', 'vt-sidebar-collapsed': s.collapsed, 'vt-sidebar-offcanvas': s.offcanvas, 'vt-sidebar-in-drawer': s.inDrawer }
        ],
        header: 'vt-sidebar-header',
        headerContent: 'vt-sidebar-header-content',
        toggle: 'vt-sidebar-toggle',
        content: 'vt-sidebar-content',
        rail: 'vt-sidebar-rail',
        nav: 'vt-sidebar-nav',
        group: 'vt-sidebar-group',
        groupLabel: 'vt-sidebar-group-label',
        list: 'vt-sidebar-list',
        sublist: 'vt-sidebar-sublist',
        item: (s: { active?: boolean; disabled?: boolean }) => ['vt-sidebar-item', { 'vt-sidebar-item-active': s.active, 'vt-sidebar-item-disabled': s.disabled }],
        itemIcon: 'vt-sidebar-item-icon',
        itemLabel: 'vt-sidebar-item-label',
        itemToggle: (s: { open?: boolean }) => ['vt-sidebar-item-toggle', { 'vt-sidebar-item-toggle-open': s.open }],
        footer: 'vt-sidebar-footer',
        footerContent: 'vt-sidebar-footer-content',
        drawer: 'vt-sidebar-drawer'
    }
});
