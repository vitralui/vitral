import type { BaseProps } from '../../base/types';

export interface AspectRatioProps extends BaseProps {
    /** Width over height: `16 / 9`, `1`, `4 / 3`. Defaults to 1. */
    ratio?: number;
}

export interface AspectRatioSlots {
    /** What fills the box — an image, a video, a map. */
    default?: () => unknown;
}
