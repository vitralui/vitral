import { defineStyle } from '../defineStyle';
import css from './floatlabel.css?raw';

export interface FloatLabelState {
    variant?: string;
    invalid?: boolean;
    /** Set when the control has a value but no placeholder to read it from. */
    filled?: boolean;
}

export const floatlabelStyle = defineStyle({
    name: 'floatlabel',
    css,
    classes: {
        root: (s: FloatLabelState) => ['vt-floatlabel', `vt-floatlabel-${s.variant ?? 'over'}`, { 'vt-floatlabel-invalid': s.invalid, 'vt-floatlabel-filled': s.filled }]
    }
});
