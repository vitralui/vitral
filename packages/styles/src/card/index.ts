import { defineStyle } from '../defineStyle';
import css from './card.css?raw';

export const cardStyle = defineStyle({
    name: 'card',
    css,
    classes: {
        root: 'vt-card',
        header: 'vt-card-header',
        body: 'vt-card-body',
        caption: 'vt-card-caption',
        title: 'vt-card-title',
        subtitle: 'vt-card-subtitle',
        content: 'vt-card-content',
        footer: 'vt-card-footer'
    }
});
