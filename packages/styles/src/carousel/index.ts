import { defineStyle } from '../defineStyle';
import css from './carousel.css?raw';

export const carouselStyle = defineStyle({
    name: 'carousel',
    css,
    classes: {
        root: (s: { orientation?: string }) => ['vt-carousel', { 'vt-carousel-vertical': s.orientation === 'vertical' }],
        header: 'vt-carousel-header',
        content: 'vt-carousel-content',
        viewport: 'vt-carousel-viewport',
        track: (s: { dragging?: boolean }) => ['vt-carousel-track', { 'vt-carousel-track-dragging': s.dragging }],
        item: (s: { active?: boolean }) => ['vt-carousel-item', { 'vt-carousel-item-active': s.active }],
        navigator: 'vt-carousel-navigator',
        footer: 'vt-carousel-footer',
        play: 'vt-carousel-play',
        indicators: 'vt-carousel-indicators',
        indicator: (s: { active?: boolean }) => ['vt-carousel-indicator', { 'vt-carousel-indicator-active': s.active }]
    }
});
