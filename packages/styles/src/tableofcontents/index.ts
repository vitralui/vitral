import { defineStyle } from '../defineStyle';
import css from './tableofcontents.css?raw';

export const tableofcontentsStyle = defineStyle({
    name: 'tableofcontents',
    css,
    classes: {
        root: 'vt-tableofcontents',
        title: 'vt-tableofcontents-title',
        list: 'vt-tableofcontents-list',
        item: 'vt-tableofcontents-item',
        link: (s: { active?: boolean; level?: number }) => ['vt-tableofcontents-link', { 'vt-tableofcontents-link-active': s.active }]
    }
});
