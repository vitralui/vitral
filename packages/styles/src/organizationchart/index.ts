import { defineStyle } from '../defineStyle';
import css from './organizationchart.css?raw';

export const organizationchartStyle = defineStyle({
    name: 'organizationchart',
    css,
    classes: {
        root: 'vt-organizationchart',
        list: 'vt-organizationchart-root',
        group: 'vt-organizationchart-group',
        item: 'vt-organizationchart-item',
        node: (s: { selectable?: boolean; selected?: boolean }) => [
            'vt-organizationchart-node',
            { 'vt-organizationchart-node-selectable': s.selectable, 'vt-organizationchart-node-selected': s.selected }
        ],
        toggler: 'vt-organizationchart-toggler'
    }
});
