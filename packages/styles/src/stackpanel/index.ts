import { defineStyle } from '../defineStyle';
import css from './stackpanel.css?raw';

export interface StackPanelState {
    orientation?: 'vertical' | 'horizontal';
    wrap?: boolean;
}

export const stackpanelStyle = defineStyle({
    name: 'stackpanel',
    css,
    classes: {
        root: (s: StackPanelState) => ['vt-stackpanel', `vt-stackpanel-${s.orientation ?? 'vertical'}`, { 'vt-stackpanel-wrap': s.wrap }]
    }
});
