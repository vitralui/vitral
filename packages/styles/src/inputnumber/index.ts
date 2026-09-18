import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './inputnumber.css?raw';

export interface InputNumberState extends FieldState {
    showButtons?: boolean;
    buttonLayout?: 'stacked' | 'horizontal';
}

export const inputnumberStyle = defineStyle({
    name: 'inputnumber',
    css,
    classes: {
        root: (s: InputNumberState) => [
            fieldClasses(s),
            'vt-inputnumber',
            { 'vt-inputnumber-stacked': s.showButtons && s.buttonLayout !== 'horizontal', 'vt-inputnumber-horizontal': s.showButtons && s.buttonLayout === 'horizontal' }
        ],
        input: 'vt-field-input vt-inputnumber-input',
        spinner: 'vt-inputnumber-spinner',
        incrementButton: 'vt-field-button vt-inputnumber-button vt-inputnumber-increment',
        decrementButton: 'vt-field-button vt-inputnumber-button vt-inputnumber-decrement'
    }
});
