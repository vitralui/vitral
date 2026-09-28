import { defineStyle } from '../defineStyle';
import css from './countdown.css?raw';

export const countdownStyle = defineStyle({
    name: 'countdown',
    css,
    classes: {
        root: (s: { variant?: string; done?: boolean }) => ['vt-countdown', s.variant === 'text' ? 'vt-countdown-text' : 'vt-countdown-tiles', { 'vt-countdown-done': s.done }],
        tile: 'vt-countdown-tile',
        value: 'vt-countdown-value',
        label: 'vt-countdown-label',
        separator: 'vt-countdown-separator'
    }
});
