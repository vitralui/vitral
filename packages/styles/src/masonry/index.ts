import { defineStyle } from '../defineStyle';
import css from './masonry.css?raw';

export const masonryStyle = defineStyle({
    name: 'masonry',
    css,
    classes: {
        root: (s: { laid?: boolean }) => ['vt-masonry', { 'vt-masonry-laid': s.laid }]
    }
});
