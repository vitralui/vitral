import { defineStyle } from '../defineStyle';
import css from './divider.css?raw';

export interface DividerState {
    layout?: 'horizontal' | 'vertical';
    type?: 'solid' | 'dashed' | 'dotted';
    align?: 'left' | 'center' | 'right' | 'top' | 'bottom';
    hasContent?: boolean;
}

export const dividerStyle = defineStyle({
    name: 'divider',
    css,
    classes: {
        root: (s: DividerState) => [
            'vt-divider',
            `vt-divider-${s.layout ?? 'horizontal'}`,
            s.type && s.type !== 'solid' && `vt-divider-${s.type}`,
            s.align && `vt-divider-${s.align}`,
            { 'vt-divider-with-content': s.hasContent }
        ],
        content: 'vt-divider-content'
    }
});
