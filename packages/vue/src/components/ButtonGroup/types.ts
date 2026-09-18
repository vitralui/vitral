import type { BaseProps } from '../../base/types';

export interface ButtonGroupProps extends BaseProps {
    /** Side by side (the default) or stacked. */
    orientation?: 'horizontal' | 'vertical';
}

export interface ButtonGroupSlots {
    default?: () => unknown;
}
