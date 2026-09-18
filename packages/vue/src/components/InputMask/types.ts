import type { BaseProps, InputVariant, Size } from '../../base/types';

export interface InputMaskProps extends BaseProps {
    /**
     * The pattern: `9` takes a digit, `a` a letter, `*` either; anything after
     * `?` is optional; every other character is typed for the reader.
     */
    mask: string;
    /** What an empty slot shows: one character, or a string as long as the mask (`'mm/dd/yyyy'`). Defaults to `_`. */
    slotChar?: string;
    /** Clear an unfinished value when the box loses focus. Defaults to true. */
    autoClear?: boolean;
    /** v-model receives only the typed characters, without the literals. */
    unmask?: boolean;
    /** Extra slot characters, each with the characters it accepts. */
    definitions?: Record<string, RegExp>;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
}

export type InputMaskEmits = {
    /** Every required slot is filled. */
    complete: [event: { originalEvent: Event; value: string }];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};
