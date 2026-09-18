import { defineStyle } from '../defineStyle';
import css from './fieldset.css?raw';

export interface FieldsetState {
    toggleable?: boolean;
    collapsed?: boolean;
}

export interface FieldsetToggleIconState {
    open?: boolean;
}

export const fieldsetStyle = defineStyle({
    name: 'fieldset',
    css,
    classes: {
        root: (s: FieldsetState) => ['vt-fieldset', { 'vt-fieldset-toggleable': s.toggleable, 'vt-fieldset-collapsed': s.toggleable && s.collapsed }],
        legend: 'vt-fieldset-legend',
        legendContent: 'vt-fieldset-legend-content',
        toggle: 'vt-fieldset-toggle',
        toggleIcon: (s: FieldsetToggleIconState) => ['vt-fieldset-toggle-icon', { 'vt-fieldset-toggle-icon-open': s.open }],
        contentContainer: 'vt-fieldset-content-container',
        content: 'vt-fieldset-content'
    }
});
