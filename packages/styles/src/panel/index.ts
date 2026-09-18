import { defineStyle } from '../defineStyle';
import css from './panel.css?raw';

export interface PanelState {
    toggleable?: boolean;
    collapsed?: boolean;
}

export interface PanelToggleIconState {
    /** Turned over while open. Only the built-in chevron, which points down when closed. */
    open?: boolean;
}

export const panelStyle = defineStyle({
    name: 'panel',
    css,
    classes: {
        root: (s: PanelState) => ['vt-panel', { 'vt-panel-toggleable': s.toggleable, 'vt-panel-collapsed': s.toggleable && s.collapsed }],
        header: 'vt-panel-header',
        title: 'vt-panel-title',
        toggle: 'vt-panel-toggle',
        toggleIcon: (s: PanelToggleIconState) => ['vt-panel-toggle-icon', { 'vt-panel-toggle-icon-open': s.open }],
        icons: 'vt-panel-icons',
        contentContainer: 'vt-panel-content-container',
        content: 'vt-panel-content',
        footer: 'vt-panel-footer'
    }
});
