import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './inputmask.css?raw';

export const inputmaskStyle = defineStyle({
    name: 'inputmask',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-inputmask'],
        input: 'vt-field-input vt-inputmask-input'
    }
});
