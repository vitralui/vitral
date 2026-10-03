import { defineStyle } from '../defineStyle';
import css from './scrollpanel.css?raw';

export const scrollpanelStyle = defineStyle({
    name: 'scrollpanel',
    css,
    classes: {
        root: 'vt-scrollpanel',
        content: 'vt-scrollpanel-content',
        bars: (s: { visibility?: 'hover' | 'always'; shown?: boolean; corner?: boolean }) => ['vt-scrollpanel-bars', { 'vt-scrollpanel-bars-shown': s.shown, 'vt-scrollpanel-bars-corner': s.corner }],
        bar: (s: { axis: 'x' | 'y'; active?: boolean; arrows?: boolean }) => [
            'vt-scrollpanel-bar',
            `vt-scrollpanel-bar-${s.axis}`,
            { 'vt-scrollpanel-bar-active': s.active, 'vt-scrollpanel-bar-arrows': s.arrows }
        ],
        track: 'vt-scrollpanel-track',
        thumb: 'vt-scrollpanel-thumb',
        arrow: (s: { direction: 'up' | 'down' | 'left' | 'right'; active?: boolean }) => ['vt-scrollpanel-arrow', `vt-scrollpanel-arrow-${s.direction}`, { 'vt-scrollpanel-arrow-active': s.active }]
    }
});
