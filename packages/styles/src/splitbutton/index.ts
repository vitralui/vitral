import { defineStyle } from '../defineStyle';
import css from './splitbutton.css?raw';

export const splitbuttonStyle = defineStyle({
    name: 'splitbutton',
    css,
    classes: {
        root: (s: { rounded?: boolean; fluid?: boolean }) => ['vt-splitbutton', { 'vt-splitbutton-rounded': s.rounded, 'vt-splitbutton-fluid': s.fluid }],
        button: 'vt-splitbutton-button',
        dropdown: 'vt-splitbutton-dropdown',
        menu: 'vt-splitbutton-menu'
    }
});
