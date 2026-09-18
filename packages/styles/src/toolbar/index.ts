import { defineStyle } from '../defineStyle';
import css from './toolbar.css?raw';

export const toolbarStyle = defineStyle({
    name: 'toolbar',
    css,
    classes: {
        root: 'vt-toolbar',
        start: 'vt-toolbar-start',
        center: 'vt-toolbar-center',
        end: 'vt-toolbar-end'
    }
});
