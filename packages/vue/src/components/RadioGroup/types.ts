import type { BaseProps, Size } from '../../base/types';

export interface RadioGroupProps extends BaseProps {
    /** The name every radio inside shares. Defaults to a generated one. */
    name?: string;
    /** How the radios are laid out; the arrow keys move between them either way. Defaults to `vertical`. */
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
    invalid?: boolean;
    /** Size of every radio inside, unless a radio names its own. */
    size?: Size;
}

export interface RadioGroupChangeEvent {
    originalEvent: Event;
    value: unknown;
}

export type RadioGroupEmits = {
    change: [event: RadioGroupChangeEvent];
};

export interface RadioGroupSlots {
    default?: () => unknown;
}
