import { defineStyle } from '../defineStyle';
import css from './kbd.css?raw';

export interface KbdState {
    size?: 'small' | 'large';
}

export const kbdStyle = defineStyle({
    name: 'kbd',
    css,
    classes: {
        root: (s: KbdState) => ['vt-kbd', { 'vt-kbd-sm': s.size === 'small', 'vt-kbd-lg': s.size === 'large' }],
        key: 'vt-kbd-key',
        separator: 'vt-kbd-separator'
    }
});
