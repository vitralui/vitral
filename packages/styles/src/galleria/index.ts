import { defineStyle } from '../defineStyle';
import css from './galleria.css?raw';

export const galleriaStyle = defineStyle({
    name: 'galleria',
    css,
    classes: {
        root: (s: { position?: string }) => ['vt-galleria', `vt-galleria-thumbnails-${s.position ?? 'bottom'}`],
        header: 'vt-galleria-header',
        footer: 'vt-galleria-footer',
        stage: 'vt-galleria-stage',
        item: (s: { dragging?: boolean }) => ['vt-galleria-item', { 'vt-galleria-item-dragging': s.dragging }],
        caption: 'vt-galleria-caption',
        navigator: (s: { side?: 'prev' | 'next' }) => ['vt-galleria-navigator', `vt-galleria-navigator-${s.side}`],
        play: 'vt-galleria-play',
        thumbnails: 'vt-galleria-thumbnails',
        thumbnailList: 'vt-galleria-thumbnail-list',
        thumbnail: (s: { active?: boolean }) => ['vt-galleria-thumbnail', { 'vt-galleria-thumbnail-active': s.active }],
        thumbnailNavigator: 'vt-galleria-thumbnail-navigator',
        indicators: 'vt-galleria-indicators',
        indicator: (s: { active?: boolean }) => ['vt-galleria-indicator', { 'vt-galleria-indicator-active': s.active }],
        mask: 'vt-galleria-mask',
        fullscreen: 'vt-galleria-fullscreen',
        close: 'vt-galleria-close'
    }
});
