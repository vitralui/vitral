import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './timepicker.css?raw';

export const timepickerStyle = defineStyle({
    name: 'timepicker',
    css,
    classes: {
        root: (s: FieldState & { open?: boolean }) => [fieldClasses(s), 'vt-timepicker'],
        input: 'vt-field-input vt-timepicker-input',
        dropdown: 'vt-field-button vt-timepicker-dropdown',
        panel: (s: { inline?: boolean; disabled?: boolean }) => ['vt-overlay vt-timepicker-panel', { 'vt-timepicker-panel-inline': s.inline, 'vt-timepicker-disabled': s.disabled }],
        list: 'vt-timepicker-list',
        option: (s: { selected?: boolean; active?: boolean }) => ['vt-timepicker-option', { 'vt-timepicker-option-selected': s.selected, 'vt-timepicker-option-active': s.active }],
        footer: 'vt-timepicker-footer'
    }
});
