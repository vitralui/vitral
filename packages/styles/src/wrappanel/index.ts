import { defineStyle } from '../defineStyle';
import css from './wrappanel.css?raw';

export interface WrapPanelState {
    orientation?: 'vertical' | 'horizontal';
    itemWidth?: boolean;
    itemHeight?: boolean;
}

export const wrappanelStyle = defineStyle({
    name: 'wrappanel',
    css,
    classes: {
        root: (s: WrapPanelState) => [
            'vt-wrappanel',
            `vt-wrappanel-${s.orientation ?? 'horizontal'}`,
            { 'vt-wrappanel-item-width': s.itemWidth, 'vt-wrappanel-item-height': s.itemHeight }
        ]
    }
});
