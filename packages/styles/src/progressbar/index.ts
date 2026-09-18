import { defineStyle } from '../defineStyle';
import css from './progressbar.css?raw';

export interface ProgressBarState {
    indeterminate?: boolean;
}

export const progressbarStyle = defineStyle({
    name: 'progressbar',
    css,
    classes: {
        root: (s: ProgressBarState) => ['vt-progressbar', { 'vt-progressbar-indeterminate': s.indeterminate }],
        track: 'vt-progressbar-track',
        value: 'vt-progressbar-value',
        label: 'vt-progressbar-label'
    }
});
