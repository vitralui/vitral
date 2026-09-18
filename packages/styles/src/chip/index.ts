import { defineStyle } from '../defineStyle';
import css from './chip.css?raw';

export const chipStyle = defineStyle({
    name: 'chip',
    css,
    classes: {
        root: 'vt-chip',
        image: 'vt-chip-image',
        icon: 'vt-chip-icon',
        label: 'vt-chip-label',
        removeButton: 'vt-chip-remove-button'
    }
});
