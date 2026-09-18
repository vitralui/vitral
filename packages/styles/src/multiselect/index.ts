import { fieldClasses, optionClasses, type FieldState, type OptionState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './multiselect.css?raw';

export interface MultiSelectState extends FieldState {
    open?: boolean;
    placeholder?: boolean;
    chips?: boolean;
}

export const multiselectStyle = defineStyle({
    name: 'multiselect',
    css,
    classes: {
        root: (s: MultiSelectState) => [
            fieldClasses(s),
            'vt-multiselect',
            { 'vt-multiselect-open': s.open, 'vt-multiselect-placeholder': s.placeholder, 'vt-multiselect-chips': s.chips }
        ],
        label: 'vt-multiselect-label',
        chip: 'vt-multiselect-chip',
        clear: 'vt-field-button vt-multiselect-clear',
        dropdown: 'vt-multiselect-dropdown',
        overlay: 'vt-overlay vt-multiselect-overlay',
        header: 'vt-multiselect-header',
        toggleAll: 'vt-multiselect-toggle-all',
        toggleAllInput: 'vt-multiselect-toggle-all-input',
        filter: 'vt-field vt-field-sm vt-multiselect-filter',
        filterInput: 'vt-field-input',
        list: 'vt-option-list vt-multiselect-list',
        group: 'vt-multiselect-group',
        groupList: 'vt-multiselect-group-list',
        optionGroup: 'vt-option-group',
        option: (s: OptionState) => [optionClasses(s), 'vt-multiselect-option'],
        box: (s: { checked?: boolean; indeterminate?: boolean }) => ['vt-multiselect-box', { 'vt-multiselect-box-checked': s.checked || s.indeterminate }],
        optionLabel: 'vt-multiselect-option-label',
        empty: 'vt-option-empty',
        footer: 'vt-multiselect-footer'
    }
});
