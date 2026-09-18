import type { BaseProps, InputVariant, Size } from '../../base/types';

export interface InputOtpProps extends BaseProps {
    /** How many characters the code has. Defaults to 4. */
    length?: number;
    /** Accept digits only, and ask for the numeric keyboard. */
    integerOnly?: boolean;
    /** Hide the characters as a password box does. */
    mask?: boolean;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
}

export type InputOtpEmits = {
    change: [event: { originalEvent: Event; value: string }];
    /** Every box holds a character. */
    complete: [event: { originalEvent: Event; value: string }];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface InputOtpSlots {
    /** Replaces a box. The events wire it up; `attrs` carries its name and state. */
    default?: (props: {
        index: number;
        value: string;
        attrs: Record<string, unknown>;
        events: { input: (event: Event) => void; keydown: (event: KeyboardEvent) => void; paste: (event: ClipboardEvent) => void; focus: (event: FocusEvent) => void };
    }) => unknown;
}
