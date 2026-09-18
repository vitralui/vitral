import { defineStyle } from '../defineStyle';
import css from './badge.css?raw';

export interface BadgeState {
    severity?: string;
    size?: 'small' | 'large' | 'xlarge';
    dot?: boolean;
}

export const badgeStyle = defineStyle({
    name: 'badge',
    css,
    classes: {
        root: (s: BadgeState) => [
            'vt-badge',
            s.severity && s.severity !== 'primary' && `vt-badge-${s.severity}`,
            { 'vt-badge-sm': s.size === 'small', 'vt-badge-lg': s.size === 'large', 'vt-badge-xl': s.size === 'xlarge', 'vt-badge-dot': s.dot }
        ]
    }
});
