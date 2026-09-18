import { defineStyle } from '../defineStyle';
import css from './tag.css?raw';

export interface TagState {
    severity?: string;
    rounded?: boolean;
}

export const tagStyle = defineStyle({
    name: 'tag',
    css,
    classes: {
        root: (s: TagState) => ['vt-tag', s.severity && s.severity !== 'primary' && `vt-tag-${s.severity}`, { 'vt-tag-rounded': s.rounded }],
        icon: 'vt-tag-icon',
        label: 'vt-tag-label',
        removeButton: 'vt-tag-remove-button'
    }
});
