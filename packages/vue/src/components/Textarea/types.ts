import type { BaseProps, InputVariant, Size } from '../../base/types';

export interface TextareaProps extends BaseProps {
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    /** Grows with its content instead of scrolling, and drops the resize handle. */
    autoResize?: boolean;
    /** Visible lines of text; with `autoResize`, the height it starts from and never shrinks below. */
    rows?: number;
}
