import { defineStyle } from '../defineStyle';
import css from './virtualscroller.css?raw';

export const virtualscrollerStyle = defineStyle({
    name: 'virtualscroller',
    css,
    classes: {
        root: (s: { orientation?: string; inline?: boolean }) => [
            'vt-virtualscroller',
            { 'vt-virtualscroller-horizontal': s.orientation === 'horizontal', 'vt-virtualscroller-inline': s.inline }
        ],
        spacer: 'vt-virtualscroller-spacer',
        content: 'vt-virtualscroller-content',
        loader: 'vt-virtualscroller-loader'
    }
});
