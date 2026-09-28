import { defineStyle } from '../defineStyle';
import css from './copybutton.css?raw';

export const copybuttonStyle = defineStyle({
    name: 'copybutton',
    css,
    classes: {
        root: 'vt-copybutton',
        button: (s: { copied?: boolean }) => ['vt-copybutton-button', { 'vt-copybutton-copied': s.copied }],
        status: 'vt-copybutton-status'
    }
});
