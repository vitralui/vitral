import { optionClasses, type OptionState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './listbox.css?raw';

export interface ListboxState {
    disabled?: boolean;
    invalid?: boolean;
    fluid?: boolean;
}

export const listboxStyle = defineStyle({
    name: 'listbox',
    css,
    classes: {
        root: (s: ListboxState) => ['vt-listbox', { 'vt-listbox-disabled': s.disabled, 'vt-listbox-invalid': s.invalid, 'vt-listbox-fluid': s.fluid }],
        header: 'vt-listbox-header',
        filter: 'vt-field vt-field-sm vt-field-fluid vt-listbox-filter',
        filterInput: 'vt-field-input',
        list: 'vt-option-list vt-listbox-list',
        group: 'vt-listbox-group',
        groupList: 'vt-listbox-group-list',
        optionGroup: 'vt-option-group',
        option: (s: OptionState) => [optionClasses(s), 'vt-listbox-option'],
        optionLabel: 'vt-listbox-option-label',
        optionCheck: 'vt-listbox-option-check',
        empty: 'vt-option-empty',
        footer: 'vt-listbox-footer'
    }
});
