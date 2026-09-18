import { defineStyle } from '../defineStyle';
import css from './label.css?raw';

export interface LabelState {
    size?: 'small' | 'large';
    disabled?: boolean;
}

export const labelStyle = defineStyle({
    name: 'label',
    css,
    classes: {
        root: (s: LabelState) => ['vt-label', { 'vt-label-sm': s.size === 'small', 'vt-label-lg': s.size === 'large', 'vt-label-disabled': s.disabled }],
        required: 'vt-label-required'
    }
});
