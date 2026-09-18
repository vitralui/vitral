import { fieldClasses, optionClasses, type FieldState, type OptionState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './autocomplete.css?raw';

export interface AutoCompleteState extends FieldState {
    open?: boolean;
    multiple?: boolean;
    dropdown?: boolean;
}

export const autocompleteStyle = defineStyle({
    name: 'autocomplete',
    css,
    classes: {
        root: (s: AutoCompleteState) => [
            fieldClasses(s),
            'vt-autocomplete',
            { 'vt-autocomplete-open': s.open, 'vt-autocomplete-multiple': s.multiple, 'vt-autocomplete-dropdown-on': s.dropdown }
        ],
        chips: 'vt-autocomplete-chips',
        chipItem: 'vt-autocomplete-chip-item',
        chip: 'vt-autocomplete-chip',
        input: 'vt-field-input vt-autocomplete-input',
        clear: 'vt-field-button vt-autocomplete-clear',
        loader: 'vt-autocomplete-loader',
        dropdown: 'vt-autocomplete-dropdown',
        overlay: 'vt-overlay vt-autocomplete-overlay',
        list: 'vt-option-list vt-autocomplete-list',
        group: 'vt-autocomplete-group',
        groupList: 'vt-autocomplete-group-list',
        optionGroup: 'vt-option-group',
        option: (s: OptionState) => [optionClasses(s), 'vt-autocomplete-option'],
        optionLabel: 'vt-autocomplete-option-label',
        empty: 'vt-option-empty',
        status: 'vt-sr-only'
    }
});
