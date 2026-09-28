import { defineStyle } from '../defineStyle';
import css from './emptystate.css?raw';

export interface EmptyStateState {
    size?: 'small' | 'large';
    severity?: string;
    align?: 'center' | 'start';
}

export const emptystateStyle = defineStyle({
    name: 'emptystate',
    css,
    classes: {
        root: (s: EmptyStateState) => [
            'vt-emptystate',
            s.severity && `vt-emptystate-${s.severity}`,
            { 'vt-emptystate-sm': s.size === 'small', 'vt-emptystate-lg': s.size === 'large', 'vt-emptystate-start': s.align === 'start' }
        ],
        icon: 'vt-emptystate-icon',
        title: 'vt-emptystate-title',
        description: 'vt-emptystate-description',
        actions: 'vt-emptystate-actions'
    }
});
