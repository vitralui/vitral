import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './inputcolor.css?raw';

export interface InputColorSwatchState {
    selected?: boolean;
}

export const inputcolorStyle = defineStyle({
    name: 'inputcolor',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-inputcolor'],
        swatch: 'vt-inputcolor-swatch',
        input: 'vt-field-input vt-inputcolor-input',
        clear: 'vt-field-button vt-inputcolor-clear',
        panel: 'vt-overlay vt-inputcolor-panel',
        picker: 'vt-inputcolor-picker',
        swatches: 'vt-inputcolor-swatches',
        option: (s: InputColorSwatchState) => ['vt-inputcolor-option', { 'vt-inputcolor-option-selected': s.selected }]
    }
});
