import { defineStyle } from '../defineStyle';
import css from './speeddial.css?raw';

export interface SpeedDialState {
    open?: boolean;
    direction?: string;
    radial?: boolean;
    rotate?: boolean;
    disabled?: boolean;
}

export const speeddialStyle = defineStyle({
    name: 'speeddial',
    css,
    classes: {
        root: (s: SpeedDialState) => [
            'vt-speeddial',
            !s.radial && s.direction && `vt-speeddial-${s.direction.split('-')[0]}`,
            { 'vt-speeddial-open': s.open, 'vt-speeddial-radial': s.radial, 'vt-speeddial-rotate': s.rotate, 'vt-speeddial-disabled': s.disabled }
        ],
        button: 'vt-speeddial-button',
        list: 'vt-speeddial-list',
        item: 'vt-speeddial-item',
        action: (s: { disabled?: boolean }) => ['vt-speeddial-action', { 'vt-speeddial-action-disabled': s.disabled }],
        mask: 'vt-speeddial-mask'
    }
});
