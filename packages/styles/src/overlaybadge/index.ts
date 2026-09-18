import { defineStyle } from '../defineStyle';
import css from './overlaybadge.css?raw';

/** Positions a badge on what it wraps; the badge's own look comes from `badgeStyle`. */
export const overlaybadgeStyle = defineStyle({
    name: 'overlaybadge',
    css,
    classes: {
        root: 'vt-overlaybadge',
        badge: 'vt-overlaybadge-badge'
    }
});
