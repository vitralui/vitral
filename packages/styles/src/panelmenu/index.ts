import { defineStyle } from '../defineStyle';
import css from './panelmenu.css?raw';

export const panelmenuStyle = defineStyle({
    name: 'panelmenu',
    css,
    classes: {
        root: 'vt-panelmenu',
        panel: 'vt-panelmenu-panel',
        header: (s: { disabled?: boolean; open?: boolean }) => ['vt-panelmenu-header', { 'vt-panelmenu-header-disabled': s.disabled, 'vt-panelmenu-header-open': s.open }],
        headerLabel: 'vt-panelmenu-header-label',
        icon: 'vt-panelmenu-icon',
        toggleIcon: (s: { open?: boolean }) => ['vt-panelmenu-toggle-icon', { 'vt-panelmenu-toggle-icon-open': s.open }],
        content: 'vt-panelmenu-content',
        tree: 'vt-panelmenu-tree',
        group: 'vt-panelmenu-group',
        item: (s: { disabled?: boolean; expanded?: boolean }) => ['vt-panelmenu-item', { 'vt-panelmenu-item-disabled': s.disabled, 'vt-panelmenu-item-expanded': s.expanded }],
        itemContent: 'vt-panelmenu-item-content',
        itemLabel: 'vt-panelmenu-item-label'
    }
});
