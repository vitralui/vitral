import { defineStyle } from '../defineStyle';
import css from './blockui.css?raw';

export const blockuiStyle = defineStyle({
    name: 'blockui',
    css,
    classes: {
        root: 'vt-blockui',
        content: 'vt-blockui-content',
        mask: (s: { fullScreen?: boolean }) => ['vt-blockui-mask', { 'vt-blockui-mask-fullscreen': s.fullScreen }]
    }
});
