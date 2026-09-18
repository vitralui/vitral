import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './inputpassword.css?raw';

export type PasswordStrengthState = 'weak' | 'medium' | 'strong' | null;

export const inputpasswordStyle = defineStyle({
    name: 'inputpassword',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-inputpassword'],
        input: 'vt-field-input vt-inputpassword-input',
        clear: 'vt-field-button vt-inputpassword-clear',
        reveal: 'vt-field-button vt-inputpassword-reveal',
        overlay: 'vt-overlay vt-inputpassword-overlay',
        meter: 'vt-inputpassword-meter',
        meterLabel: (s: { strength?: PasswordStrengthState }) => ['vt-inputpassword-meter-label', s.strength && `vt-inputpassword-meter-${s.strength}`],
        info: 'vt-inputpassword-info'
    }
});
