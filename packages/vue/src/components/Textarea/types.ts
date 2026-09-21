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
    /**
     * Which way the reader may drag the grip. Defaults to the theme's, which is
     * `vertical`: a field that fills its container has nowhere to go sideways.
     * `both` suits one with a width of its own. `autoResize` takes the grip
     * away entirely, since the box is already deciding its own height.
     */
    resize?: 'vertical' | 'horizontal' | 'both' | 'none';
}
