import { fieldClasses, optionClasses, type FieldState, type OptionState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './cascadeselect.css?raw';

export interface CascadeSelectState extends FieldState {
    open?: boolean;
    placeholder?: boolean;
}

export const cascadeselectStyle = defineStyle({
    name: 'cascadeselect',
    css,
    classes: {
        root: (s: CascadeSelectState) => [fieldClasses(s), 'vt-cascadeselect', { 'vt-cascadeselect-open': s.open, 'vt-cascadeselect-placeholder': s.placeholder }],
        label: 'vt-cascadeselect-label',
        clear: 'vt-field-button vt-cascadeselect-clear',
        dropdown: 'vt-cascadeselect-dropdown',
        overlay: 'vt-overlay vt-cascadeselect-overlay',
        list: 'vt-option-list vt-cascadeselect-list',
        sublist: 'vt-option-list vt-cascadeselect-list vt-cascadeselect-sublist',
        item: 'vt-cascadeselect-item',
        option: (s: OptionState & { group?: boolean }) => [optionClasses(s), 'vt-cascadeselect-option', { 'vt-cascadeselect-option-group': s.group }],
        optionLabel: 'vt-cascadeselect-option-label',
        groupIcon: 'vt-cascadeselect-group-icon',
        empty: 'vt-option-empty'
    }
});
