import { defineStyle } from '../defineStyle';
import css from './checkbox.css?raw';

export interface CheckboxState {
    checked?: boolean;
    indeterminate?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    size?: 'small' | 'large';
}

export const checkboxStyle = defineStyle({
    name: 'checkbox',
    css,
    classes: {
        root: (s: CheckboxState) => [
            'vt-checkbox',
            {
                'vt-checkbox-checked': s.checked && !s.indeterminate,
                'vt-checkbox-indeterminate': s.indeterminate,
                'vt-checkbox-invalid': s.invalid,
                'vt-checkbox-disabled': s.disabled,
                'vt-checkbox-sm': s.size === 'small',
                'vt-checkbox-lg': s.size === 'large'
            }
        ],
        control: 'vt-checkbox-control',
        input: 'vt-checkbox-input',
        box: 'vt-checkbox-box',
        icon: 'vt-checkbox-icon',
        label: 'vt-checkbox-label'
    }
});
