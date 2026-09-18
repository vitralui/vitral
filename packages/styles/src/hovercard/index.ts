import { defineStyle } from '../defineStyle';
import css from './hovercard.css?raw';

export const hovercardStyle = defineStyle({
    name: 'hovercard',
    css,
    classes: {
        trigger: 'vt-hovercard-trigger',
        root: 'vt-overlay vt-hovercard'
    }
});
