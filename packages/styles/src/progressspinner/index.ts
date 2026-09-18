import { defineStyle } from '../defineStyle';
import css from './progressspinner.css?raw';

export interface ProgressSpinnerState {
    determinate?: boolean;
}

export const progressspinnerStyle = defineStyle({
    name: 'progressspinner',
    css,
    classes: {
        root: (s: ProgressSpinnerState) => ['vt-progressspinner', { 'vt-progressspinner-determinate': s.determinate }],
        svg: 'vt-progressspinner-svg',
        track: 'vt-progressspinner-track',
        circle: 'vt-progressspinner-circle'
    }
});
