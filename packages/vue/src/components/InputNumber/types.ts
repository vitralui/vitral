import type { BaseProps, InputVariant, Size } from '../../base/types';

export interface InputNumberProps extends BaseProps {
    min?: number;
    max?: number;
    /** What an arrow key or a spin button adds or takes away; PageUp/PageDown move ten of these. Defaults to 1. */
    step?: number;
    mode?: 'decimal' | 'currency' | 'percent';
    /** ISO 4217 code, such as `BRL`; required by `mode: 'currency'`. */
    currency?: string;
    /** A BCP 47 tag for the number format. Defaults to the Vitral locale's `code`. */
    locale?: string;
    minFractionDigits?: number;
    maxFractionDigits?: number;
    /** Thousands separators. Defaults to true. */
    useGrouping?: boolean;
    /** Text before the number, such as `≈ `; it is part of the display, not of the value. */
    prefix?: string;
    /** Text after the number, such as ` km`. */
    suffix?: string;
    /** Spin buttons. */
    showButtons?: boolean;
    /** `stacked` puts up over down at the end of the field; `horizontal` puts minus before the number and plus after it. */
    buttonLayout?: 'stacked' | 'horizontal';
    /** Whether clearing the text leaves the value empty (`null`). Defaults to true; when false, an emptied field goes back to its last value. */
    allowEmpty?: boolean;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
}

export interface InputNumberInputEvent {
    originalEvent?: Event;
    /** The number the text reads as right now — null while it reads as nothing. */
    value: number | null;
}

export type InputNumberEmits = {
    /** Every edit, as typed or spun, before the value is committed on blur or Enter. */
    input: [event: InputNumberInputEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};
