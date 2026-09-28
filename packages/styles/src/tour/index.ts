import { defineStyle } from '../defineStyle';
import css from './tour.css?raw';

export interface TourState {
    /** The popover sits in the middle of the screen, with nothing to point at. */
    centered?: boolean;
    animate?: boolean;
}

export const tourStyle = defineStyle({
    name: 'tour',
    css,
    classes: {
        root: (s: TourState) => ['vt-tour', { 'vt-tour-animated': s.animate }],
        overlay: 'vt-tour-overlay',
        overlayPath: 'vt-tour-overlay-path',
        popover: (s: TourState) => ['vt-tour-popover', { 'vt-tour-popover-centered': s.centered }],
        arrow: 'vt-tour-arrow',
        closeButton: 'vt-tour-close-button',
        image: 'vt-tour-image',
        title: 'vt-tour-title',
        description: 'vt-tour-description',
        content: 'vt-tour-content',
        footer: 'vt-tour-footer',
        progress: 'vt-tour-progress',
        dots: 'vt-tour-dots',
        dot: (s: { active?: boolean; done?: boolean }) => ['vt-tour-dot', { 'vt-tour-dot-active': s.active, 'vt-tour-dot-done': s.done }],
        bar: 'vt-tour-bar',
        barFill: 'vt-tour-bar-fill',
        footerButtons: 'vt-tour-footer-buttons',
        previousButton: 'vt-tour-button vt-tour-previous-button',
        nextButton: 'vt-tour-button vt-tour-next-button',
        /** Worn by the highlighted element itself, not by anything the tour draws. */
        activeElement: (s: { interactive?: boolean }) => ['vt-tour-active-element', { 'vt-tour-inert-element': s.interactive === false }]
    }
});
