import { defineStyle } from '../defineStyle';
import css from './toggleswitch.css?raw';

export interface ToggleSwitchState {
    checked?: boolean;
    invalid?: boolean;
    disabled?: boolean;
}

export const toggleswitchStyle = defineStyle({
    name: 'toggleswitch',
    css,
    classes: {
        root: (s: ToggleSwitchState) => [
            'vt-toggleswitch',
            { 'vt-toggleswitch-checked': s.checked, 'vt-toggleswitch-invalid': s.invalid, 'vt-toggleswitch-disabled': s.disabled }
        ],
        header: 'vt-toggleswitch-header',
        body: 'vt-toggleswitch-body',
        track: 'vt-toggleswitch-track',
        input: 'vt-toggleswitch-input',
        knob: 'vt-toggleswitch-knob',
        content: 'vt-toggleswitch-content'
    }
});
