import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './inputtext.css?raw';

export const inputtextStyle = defineStyle({
    name: 'inputtext',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-inputtext'],
        input: 'vt-field-input vt-inputtext-input',
        prefix: 'vt-inputtext-prefix',
        suffix: 'vt-inputtext-suffix',
        clear: 'vt-field-button vt-inputtext-clear'
    }
});
