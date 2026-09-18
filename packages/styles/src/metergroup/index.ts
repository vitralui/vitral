import { defineStyle } from '../defineStyle';
import css from './metergroup.css?raw';

export const metergroupStyle = defineStyle({
    name: 'metergroup',
    css,
    classes: {
        root: (s: { orientation?: string; labelPosition?: string }) => [
            'vt-metergroup',
            { 'vt-metergroup-vertical': s.orientation === 'vertical', 'vt-metergroup-label-start': s.labelPosition === 'start' }
        ],
        track: 'vt-metergroup-track',
        meter: 'vt-metergroup-meter',
        labels: (s: { orientation?: string }) => ['vt-metergroup-labels', { 'vt-metergroup-labels-vertical': s.orientation === 'vertical' }],
        label: 'vt-metergroup-label',
        marker: 'vt-metergroup-marker',
        icon: 'vt-metergroup-icon',
        text: 'vt-metergroup-text',
        value: 'vt-metergroup-value'
    }
});
