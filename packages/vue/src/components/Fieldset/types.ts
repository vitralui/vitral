import type { BaseProps, IconProp } from '../../base/types';

export interface FieldsetProps extends BaseProps {
    /** The legend's text. */
    legend?: string;
    /** Makes the legend a button that shows and hides the group. */
    toggleable?: boolean;
    toggleIcon?: IconProp;
}

export interface FieldsetToggleEvent {
    originalEvent: Event;
    /** The new `collapsed` value. */
    value: boolean;
}

export type FieldsetEmits = {
    toggle: [event: FieldsetToggleEvent];
};

export interface FieldsetSlots {
    default?: () => unknown;
    /** Replaces the legend's text. */
    legend?: () => unknown;
    toggleicon?: (props: { collapsed: boolean }) => unknown;
}
