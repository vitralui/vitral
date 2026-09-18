import type { BaseProps, InputVariant, Size } from '../../base/types';

export interface InputTextProps extends BaseProps {
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

export interface InputTextSlots {
    /** Content inside the field, before the text — an icon, a currency sign. */
    prefix?: () => unknown;
    /** Content inside the field, after the text — a unit, a button. */
    suffix?: () => unknown;
}
