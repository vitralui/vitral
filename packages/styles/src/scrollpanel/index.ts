import { defineStyle } from '../defineStyle';
import css from './scrollpanel.css?raw';

export const scrollpanelStyle = defineStyle({
    name: 'scrollpanel',
    css,
    classes: {
        root: 'vt-scrollpanel',
        content: 'vt-scrollpanel-content',
        bar: (s: { axis: 'x' | 'y'; active?: boolean }) => ['vt-scrollpanel-bar', `vt-scrollpanel-bar-${s.axis}`, { 'vt-scrollpanel-bar-active': s.active }],
        thumb: 'vt-scrollpanel-thumb'
    }
});
