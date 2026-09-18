import { defineStyle } from '../defineStyle';
import css from './iconfield.css?raw';

export const iconfieldStyle = defineStyle({
    name: 'iconfield',
    css,
    classes: {
        root: (s: { fluid?: boolean }) => ['vt-iconfield', { 'vt-iconfield-fluid': s.fluid }],
        icon: 'vt-inputicon'
    }
});
