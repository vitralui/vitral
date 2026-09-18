import type { BaseProps, IconProp, Size } from '../../base/types';

export interface ToggleButtonProps extends BaseProps {
    onLabel?: string;
    offLabel?: string;
    onIcon?: IconProp;
    offIcon?: IconProp;
    size?: Size;
    disabled?: boolean;
    invalid?: boolean;
    fluid?: boolean;
}

export interface ToggleButtonChangeEvent {
    originalEvent: Event;
    value: boolean;
}

export type ToggleButtonEmits = {
    change: [event: ToggleButtonChangeEvent];
};

export interface ToggleButtonSlots {
    /** Replaces the label; receives the current state. */
    default?: (props: { checked: boolean }) => unknown;
    icon?: (props: { checked: boolean }) => unknown;
}
