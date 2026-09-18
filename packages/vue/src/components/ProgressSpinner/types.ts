import type { BaseProps } from '../../base/types';

export interface ProgressSpinnerProps extends BaseProps {
    /** Width and height: a CSS length, or pixels. Defaults to the `size` token (2rem). */
    size?: string | number;
    /** Stroke thickness, in units of a 32-unit ring — pixels at the default size. Defaults to 3. */
    strokeWidth?: number;
    /** 0–100 draws a determinate ring; leave it out for the turning arc. */
    value?: number;
    /** One turn of the indeterminate arc, as a CSS time. */
    animationDuration?: string;
}
