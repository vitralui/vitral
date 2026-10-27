import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface InputColorProps extends BaseProps {
    /**
     * Offer an opacity slider; the value then carries it as eight hex digits
     * (`'#33669980'`). Off by default: the value is `'#rrggbb'`.
     */
    alpha?: boolean;
    /** The colour the panel starts on while the value is empty. Defaults to `'#ff0000'`. */
    defaultColor?: string;
    /** Colours offered under the picker, one press each: the palette the value usually comes from. */
    swatches?: string[];
    /** Shows a button that empties the field while it holds a colour. */
    clearable?: boolean;
    placeholder?: string;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type InputColorEmits = {
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    clear: [];
    show: [];
    hide: [];
};
