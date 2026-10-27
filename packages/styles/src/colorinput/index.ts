import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './colorinput.css?raw';

export interface ColorInputSwatchState {
    selected?: boolean;
}

export const colorinputStyle = defineStyle({
    name: 'colorinput',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-colorinput'],
        swatch: 'vt-colorinput-swatch',
        input: 'vt-field-input vt-colorinput-input',
        clear: 'vt-field-button vt-colorinput-clear',
        panel: 'vt-overlay vt-colorinput-panel',
        picker: 'vt-colorinput-picker',
        swatches: 'vt-colorinput-swatches',
        option: (s: ColorInputSwatchState) => ['vt-colorinput-option', { 'vt-colorinput-option-selected': s.selected }]
    }
});
