import type { Component } from 'vue';
import type { BaseProps, IconProp, Severity, Size } from '../../base/types';

export type ButtonSeverity = Severity;
export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'link';

export interface ButtonProps extends BaseProps {
    label?: string;
    icon?: IconProp;
    iconPos?: 'left' | 'right' | 'top' | 'bottom';
    /** Shows a spinner, disables the button and marks it busy. */
    loading?: boolean;
    loadingIcon?: IconProp;
    severity?: ButtonSeverity;
    variant?: ButtonVariant;
    size?: Size;
    rounded?: boolean;
    raised?: boolean;
    fluid?: boolean;
    badge?: string | number;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    /** Render as another element or component — `'a'`, `RouterLink` — keeping the button's look and behaviour. */
    as?: string | Component;
}

export interface ButtonSlots {
    default?: () => unknown;
    icon?: () => unknown;
    loadingicon?: () => unknown;
}
