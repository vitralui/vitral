import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './inputotp.css?raw';

export const inputotpStyle = defineStyle({
    name: 'inputotp',
    css,
    classes: {
        root: 'vt-inputotp',
        field: (s: FieldState) => [fieldClasses(s), 'vt-inputotp-field'],
        input: 'vt-field-input vt-inputotp-input'
    }
});
