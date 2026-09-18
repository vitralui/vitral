import { defineStyle } from '../defineStyle';
import css from './timeline.css?raw';

export interface TimelineState {
    layout?: 'vertical' | 'horizontal';
    align?: 'left' | 'right' | 'alternate' | 'top' | 'bottom';
    opposite?: boolean;
}

export const timelineStyle = defineStyle({
    name: 'timeline',
    css,
    classes: {
        root: (s: TimelineState) => [
            'vt-timeline',
            `vt-timeline-${s.layout ?? 'vertical'}`,
            `vt-timeline-align-${s.align ?? 'left'}`,
            { 'vt-timeline-no-opposite': !s.opposite }
        ],
        event: 'vt-timeline-event',
        opposite: 'vt-timeline-opposite',
        separator: 'vt-timeline-separator',
        marker: 'vt-timeline-marker',
        connector: 'vt-timeline-connector',
        content: 'vt-timeline-content'
    }
});
