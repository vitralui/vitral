import { defineStyle } from '../defineStyle';
import { nestedMenuClasses } from '../tieredmenu';
import css from './menubar.css?raw';

export const menubarStyle = defineStyle({
    name: 'menubar',
    css,
    classes: {
        root: (s: { mobile?: boolean; open?: boolean }) => ['vt-menubar', { 'vt-menubar-mobile': s.mobile, 'vt-menubar-mobile-open': s.mobile && s.open }],
        start: 'vt-menubar-start',
        end: 'vt-menubar-end',
        button: 'vt-menubar-button',
        ...nestedMenuClasses('vt-menubar')
    }
});
