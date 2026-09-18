import { defineStyle } from '../defineStyle';
import css from './image.css?raw';

export const imageStyle = defineStyle({
    name: 'image',
    css,
    classes: {
        root: 'vt-image',
        image: 'vt-image-img',
        trigger: 'vt-image-trigger',
        indicator: 'vt-image-indicator',
        mask: 'vt-image-mask',
        dialog: 'vt-image-dialog',
        toolbar: 'vt-image-toolbar',
        action: 'vt-image-action',
        preview: 'vt-image-preview'
    }
});
