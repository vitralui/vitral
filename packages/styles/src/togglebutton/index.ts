import { defineStyle } from '../defineStyle';
import css from './togglebutton.css?raw';

export interface ToggleButtonState {
    checked?: boolean;
    size?: string;
    invalid?: boolean;
    fluid?: boolean;
}

export const togglebuttonStyle = defineStyle({
    name: 'togglebutton',
    css,
    classes: {
        root: (s: ToggleButtonState) => [
            'vt-togglebutton',
            {
                'vt-togglebutton-checked': s.checked,
                'vt-togglebutton-sm': s.size === 'small',
                'vt-togglebutton-lg': s.size === 'large',
                'vt-togglebutton-invalid': s.invalid,
                'vt-togglebutton-fluid': s.fluid
            }
        ],
        icon: 'vt-togglebutton-icon',
        label: 'vt-togglebutton-label'
    }
});
