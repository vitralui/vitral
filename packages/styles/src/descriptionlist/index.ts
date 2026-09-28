import { defineStyle } from '../defineStyle';
import css from './descriptionlist.css?raw';

export interface DescriptionListState {
    layout?: 'vertical' | 'horizontal';
    bordered?: boolean;
    striped?: boolean;
    size?: 'small' | 'large';
}

export const descriptionlistStyle = defineStyle({
    name: 'descriptionlist',
    css,
    classes: {
        root: (s: DescriptionListState) => [
            'vt-descriptionlist',
            s.layout === 'horizontal' ? 'vt-descriptionlist-horizontal' : 'vt-descriptionlist-vertical',
            { 'vt-descriptionlist-bordered': s.bordered, 'vt-descriptionlist-striped': s.striped, 'vt-descriptionlist-sm': s.size === 'small', 'vt-descriptionlist-lg': s.size === 'large' }
        ],
        header: 'vt-descriptionlist-header',
        title: 'vt-descriptionlist-title',
        extra: 'vt-descriptionlist-extra',
        list: 'vt-descriptionlist-list',
        item: 'vt-descriptionlist-item',
        label: 'vt-descriptionlist-label',
        value: 'vt-descriptionlist-value'
    }
});
