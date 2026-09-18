import { defineStyle } from '../defineStyle';
import css from './slider.css?raw';

export interface SliderState {
    orientation?: 'horizontal' | 'vertical';
    range?: boolean;
    disabled?: boolean;
    dragging?: boolean;
}

export interface SliderThumbState {
    index: 0 | 1;
    /** Pressed or being dragged. */
    active?: boolean;
}

export const sliderStyle = defineStyle({
    name: 'slider',
    css,
    classes: {
        root: (s: SliderState) => [
            'vt-slider',
            {
                'vt-slider-horizontal': s.orientation !== 'vertical',
                'vt-slider-vertical': s.orientation === 'vertical',
                'vt-slider-range-mode': s.range,
                'vt-slider-disabled': s.disabled,
                'vt-slider-dragging': s.dragging
            }
        ],
        track: 'vt-slider-track',
        range: 'vt-slider-range',
        thumb: (s: SliderThumbState) => ['vt-slider-thumb', { 'vt-slider-thumb-active': s.active }],
        /** The hidden text that tells a range's two thumbs apart. */
        label: 'vt-slider-label'
    }
});
