import type { BaseProps, Size } from '../../base/types';

export interface CheckboxProps extends BaseProps {
    /**
     * The value this box adds to an array v-model when checked. Leave it out
     * (or set `binary`) and v-model is a boolean instead.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any;
    /** v-model is a single checked/unchecked value rather than an array. Implied when there is no `value`. */
    binary?: boolean;
    /** What a checked binary box sets v-model to. Defaults to true. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trueValue?: any;
    /** What an unchecked binary box sets v-model to. Defaults to false. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    falseValue?: any;
    /** The text beside the box; the default slot takes richer content. Either becomes its `<label>`. */
    label?: string;
    size?: Size;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
}

export interface CheckboxChangeEvent {
    originalEvent: Event;
    checked: boolean;
    value: unknown;
}

export type CheckboxEmits = {
    change: [event: CheckboxChangeEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface CheckboxSlots {
    /** The label's content. */
    default?: () => unknown;
    /** Replaces the check (and the dash of the mixed state). */
    icon?: (props: { checked: boolean; indeterminate: boolean }) => unknown;
}
