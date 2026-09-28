import { defineStyle } from '../defineStyle';
import css from './stat.css?raw';

export interface StatState {
    size?: 'small' | 'large';
    loading?: boolean;
}

export const statStyle = defineStyle({
    name: 'stat',
    css,
    classes: {
        root: (s: StatState) => ['vt-stat', { 'vt-stat-sm': s.size === 'small', 'vt-stat-lg': s.size === 'large', 'vt-stat-loading': s.loading }],
        header: 'vt-stat-header',
        icon: 'vt-stat-icon',
        label: 'vt-stat-label',
        body: 'vt-stat-body',
        value: 'vt-stat-value',
        prefix: 'vt-stat-affix vt-stat-prefix',
        suffix: 'vt-stat-affix vt-stat-suffix',
        /** `good` is the colour, `trend` the arrow: a fall in costs points down and is still good news. */
        delta: (s: { trend?: 'up' | 'down' | 'neutral'; good?: boolean }) => [
            'vt-stat-delta',
            s.trend === 'neutral' ? 'vt-stat-delta-neutral' : s.good ? 'vt-stat-delta-good' : 'vt-stat-delta-bad'
        ],
        caption: 'vt-stat-caption',
        chart: 'vt-stat-chart',
        placeholder: 'vt-stat-placeholder'
    }
});
