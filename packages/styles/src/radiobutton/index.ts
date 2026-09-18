import { defineStyle } from '../defineStyle';
import css from './radiobutton.css?raw';

export interface RadioButtonState {
    checked?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    size?: 'small' | 'large';
}

export const radiobuttonStyle = defineStyle({
    name: 'radiobutton',
    css,
    classes: {
        root: (s: RadioButtonState) => [
            'vt-radiobutton',
            {
                'vt-radiobutton-checked': s.checked,
                'vt-radiobutton-invalid': s.invalid,
                'vt-radiobutton-disabled': s.disabled,
                'vt-radiobutton-sm': s.size === 'small',
                'vt-radiobutton-lg': s.size === 'large'
            }
        ],
        control: 'vt-radiobutton-control',
        input: 'vt-radiobutton-input',
        box: 'vt-radiobutton-box',
        dot: 'vt-radiobutton-dot',
        label: 'vt-radiobutton-label'
    }
});
