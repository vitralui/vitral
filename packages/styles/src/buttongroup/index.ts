import { defineStyle } from '../defineStyle';
import css from './buttongroup.css?raw';

export const buttongroupStyle = defineStyle({
    name: 'buttongroup',
    css,
    classes: {
        root: (s: { orientation?: 'horizontal' | 'vertical' }) => ['vt-buttongroup', { 'vt-buttongroup-vertical': s.orientation === 'vertical' }]
    }
});
