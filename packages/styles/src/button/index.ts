import { defineStyle } from '../defineStyle';
import css from './button.css?raw';

export type ButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';
export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'link';

export interface ButtonState {
    severity?: ButtonSeverity;
    variant?: ButtonVariant;
    size?: 'small' | 'large';
    rounded?: boolean;
    raised?: boolean;
    iconOnly?: boolean;
    iconPos?: 'left' | 'right' | 'top' | 'bottom';
    loading?: boolean;
    fluid?: boolean;
}

export const buttonStyle = defineStyle({
    name: 'button',
    css,
    classes: {
        root: (s: ButtonState) => [
            'vt-button',
            s.severity && s.severity !== 'primary' && `vt-button-${s.severity}`,
            s.variant && s.variant !== 'filled' && `vt-button-${s.variant}`,
            {
                'vt-button-sm': s.size === 'small',
                'vt-button-lg': s.size === 'large',
                'vt-button-rounded': s.rounded,
                'vt-button-raised': s.raised,
                'vt-button-icon-only': s.iconOnly,
                'vt-button-loading': s.loading,
                'vt-button-fluid': s.fluid,
                [`vt-button-icon-${s.iconPos}`]: !!s.iconPos && s.iconPos !== 'left' && !s.iconOnly
            }
        ],
        icon: 'vt-button-icon',
        loadingIcon: 'vt-button-icon vt-button-loading-icon',
        label: 'vt-button-label',
        badge: 'vt-button-badge'
    }
});
