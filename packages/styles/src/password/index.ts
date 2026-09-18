import { fieldClasses, type FieldState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './password.css?raw';

export type PasswordStrengthState = 'weak' | 'medium' | 'strong' | null;

export const passwordStyle = defineStyle({
    name: 'password',
    css,
    classes: {
        root: (s: FieldState) => [fieldClasses(s), 'vt-password'],
        input: 'vt-field-input vt-password-input',
        clear: 'vt-field-button vt-password-clear',
        reveal: 'vt-field-button vt-password-reveal',
        overlay: 'vt-overlay vt-password-overlay',
        meter: 'vt-password-meter',
        meterLabel: (s: { strength?: PasswordStrengthState }) => ['vt-password-meter-label', s.strength && `vt-password-meter-${s.strength}`],
        info: 'vt-password-info'
    }
});
