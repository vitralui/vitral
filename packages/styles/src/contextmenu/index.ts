import { defineStyle } from '../defineStyle';
import { nestedMenuClasses } from '../tieredmenu';
import css from './contextmenu.css?raw';

export const contextmenuStyle = defineStyle({
    name: 'contextmenu',
    css,
    classes: {
        root: 'vt-overlay vt-contextmenu',
        ...nestedMenuClasses('vt-contextmenu')
    }
});
