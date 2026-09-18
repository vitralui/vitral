import { defineStyle } from '../defineStyle';
import css from './scrolltop.css?raw';

export const scrolltopStyle = defineStyle({
    name: 'scrolltop',
    css,
    classes: {
        root: (s: { target?: string }) => ['vt-scrolltop', { 'vt-scrolltop-parent': s.target === 'parent' }]
    }
});
