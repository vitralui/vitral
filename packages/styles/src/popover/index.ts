import { defineStyle } from '../defineStyle';
import css from './popover.css?raw';

export const popoverStyle = defineStyle({
    name: 'popover',
    css,
    classes: {
        root: 'vt-overlay vt-popover',
        content: 'vt-popover-content'
    }
});
