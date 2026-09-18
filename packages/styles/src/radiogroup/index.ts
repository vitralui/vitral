import { defineStyle } from '../defineStyle';
import css from './radiogroup.css?raw';

export interface RadioGroupState {
    orientation?: 'horizontal' | 'vertical';
}

export const radiogroupStyle = defineStyle({
    name: 'radiogroup',
    css,
    classes: {
        root: (s: RadioGroupState) => ['vt-radiogroup', { 'vt-radiogroup-horizontal': s.orientation === 'horizontal' }]
    }
});
