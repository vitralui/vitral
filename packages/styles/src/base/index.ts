import type { ClassValue } from '@vitral/core';
import { defineStyle } from '../defineStyle';
import css from './base.css?raw';

/** Injected once by the plugin before any component style; holds the shared chrome. */
export const baseStyle = defineStyle({ name: 'base', css, classes: {} });

export type Size = 'small' | 'large';

export interface FieldState {
    size?: Size;
    variant?: 'outlined' | 'filled';
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    /** Forces the focused look while focus is somewhere the field cannot see, such as its teleported panel. */
    focused?: boolean;
}

/** The field chrome's classes; every text-like component's root starts with these. */
export function fieldClasses(state: FieldState): ClassValue {
    return [
        'vt-field',
        {
            'vt-field-sm': state.size === 'small',
            'vt-field-lg': state.size === 'large',
            'vt-field-filled': state.variant === 'filled',
            'vt-field-invalid': state.invalid,
            'vt-field-disabled': state.disabled,
            'vt-field-readonly': state.readonly,
            'vt-field-fluid': state.fluid,
            'vt-field-focus': state.focused
        }
    ];
}

export interface OptionState {
    selected?: boolean;
    focused?: boolean;
    disabled?: boolean;
}

export function optionClasses(state: OptionState): ClassValue {
    return ['vt-option', { 'vt-option-selected': state.selected, 'vt-option-focused': state.focused, 'vt-option-disabled': state.disabled }];
}
