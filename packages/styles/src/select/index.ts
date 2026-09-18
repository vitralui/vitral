import { fieldClasses, optionClasses, type FieldState, type OptionState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './select.css?raw';

export interface SelectState extends FieldState {
    open?: boolean;
    placeholder?: boolean;
}

export const selectStyle = defineStyle({
    name: 'select',
    css,
    classes: {
        root: (s: SelectState) => [fieldClasses(s), 'vt-select', { 'vt-select-open': s.open, 'vt-select-placeholder': s.placeholder }],
        label: 'vt-select-label',
        clear: 'vt-field-button vt-select-clear',
        dropdown: 'vt-select-dropdown',
        overlay: 'vt-overlay vt-select-overlay',
        header: 'vt-select-header',
        filter: 'vt-field vt-field-sm vt-field-fluid vt-select-filter',
        filterInput: 'vt-field-input',
        list: 'vt-option-list vt-select-list',
        group: 'vt-select-group',
        groupList: 'vt-select-group-list',
        optionGroup: 'vt-option-group',
        option: (s: OptionState) => [optionClasses(s), 'vt-select-option'],
        optionLabel: 'vt-select-option-label',
        optionCheck: 'vt-select-option-check',
        empty: 'vt-option-empty',
        footer: 'vt-select-footer'
    }
});
