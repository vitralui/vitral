import { defineStyle } from '../defineStyle';
import css from './inplace.css?raw';

export const inplaceStyle = defineStyle({
    name: 'inplace',
    css,
    classes: {
        root: 'vt-inplace',
        display: (s: { disabled?: boolean }) => ['vt-inplace-display', { 'vt-inplace-display-disabled': s.disabled }],
        content: 'vt-inplace-content',
        close: 'vt-inplace-close vt-icon-button'
    }
});
