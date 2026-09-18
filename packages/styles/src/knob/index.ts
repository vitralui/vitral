import { defineStyle } from '../defineStyle';
import css from './knob.css?raw';

export interface KnobState {
    readonly?: boolean;
    disabled?: boolean;
}

export const knobStyle = defineStyle({
    name: 'knob',
    css,
    classes: {
        root: (s: KnobState) => ['vt-knob', { 'vt-knob-readonly': s.readonly, 'vt-knob-disabled': s.disabled }],
        svg: 'vt-knob-svg',
        range: 'vt-knob-range',
        value: 'vt-knob-value',
        text: 'vt-knob-text'
    }
});
