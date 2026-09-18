import { defineStyle } from '../defineStyle';
import css from './selectbutton.css?raw';

export interface SelectButtonState {
    size?: string;
    invalid?: boolean;
    fluid?: boolean;
}

export interface SelectButtonItemState {
    checked?: boolean;
    disabled?: boolean;
}

export const selectbuttonStyle = defineStyle({
    name: 'selectbutton',
    css,
    classes: {
        root: (s: SelectButtonState) => [
            'vt-selectbutton',
            {
                'vt-selectbutton-sm': s.size === 'small',
                'vt-selectbutton-lg': s.size === 'large',
                'vt-selectbutton-invalid': s.invalid,
                'vt-selectbutton-fluid': s.fluid
            }
        ],
        item: (s: SelectButtonItemState) => ['vt-selectbutton-item', { 'vt-selectbutton-item-checked': s.checked }],
        icon: 'vt-selectbutton-icon',
        label: 'vt-selectbutton-label'
    }
});
