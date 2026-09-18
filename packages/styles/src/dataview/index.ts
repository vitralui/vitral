import { defineStyle } from '../defineStyle';
import css from './dataview.css?raw';

export const dataviewStyle = defineStyle({
    name: 'dataview',
    css,
    classes: {
        root: (s: { layout?: string }) => ['vt-dataview', s.layout === 'grid' ? 'vt-dataview-grid' : 'vt-dataview-list'],
        header: 'vt-dataview-header',
        content: 'vt-dataview-content',
        items: 'vt-dataview-items',
        empty: 'vt-dataview-empty',
        footer: 'vt-dataview-footer',
        paginator: (s: { position?: string }) => ['vt-dataview-paginator', `vt-dataview-paginator-${s.position ?? 'bottom'}`],
        loader: 'vt-dataview-loader'
    }
});
