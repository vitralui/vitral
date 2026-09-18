import type { BaseProps, Size } from '../../base/types';

export interface RadioButtonProps extends BaseProps {
    /** What v-model becomes when this radio is chosen; compared structurally, so objects work. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any;
    /** Radios that share a name are one group to the browser. A RadioGroup provides it. */
    name?: string;
    /** The text beside the ring; the default slot takes richer content. Either becomes its `<label>`. */
    label?: string;
    size?: Size;
    invalid?: boolean;
    disabled?: boolean;
}

export interface RadioButtonChangeEvent {
    originalEvent: Event;
    value: unknown;
}

export type RadioButtonEmits = {
    change: [event: RadioButtonChangeEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface RadioButtonSlots {
    /** The label's content. */
    default?: () => unknown;
}
