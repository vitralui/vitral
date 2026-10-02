import type { BaseProps, InputVariant, MaskFieldProps, Size } from '../../base/types';

/** With a `mask`, the box types into it as InputMask does, keeping its slots and clear button. */
export interface InputTextProps extends BaseProps, MaskFieldProps {
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    /** Shows a clear button while there is text. */
    clearable?: boolean;
    type?: string;
}

export type InputTextEmits = {
    clear: [];
    /** With a `mask`: every required slot is filled. */
    complete: [event: { originalEvent: Event; value: string }];
};

export interface InputTextSlots {
    /** Content inside the field, before the text: an icon, a currency sign. */
    prefix?: () => unknown;
    /** Content inside the field, after the text: a unit, a button. */
    suffix?: () => unknown;
}
