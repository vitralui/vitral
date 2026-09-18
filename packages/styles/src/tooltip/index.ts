import { defineStyle } from '../defineStyle';
import css from './tooltip.css?raw';

export const tooltipStyle = defineStyle({
    name: 'tooltip',
    css,
    classes: {
        root: 'vt-tooltip',
        text: 'vt-tooltip-text'
    }
});
