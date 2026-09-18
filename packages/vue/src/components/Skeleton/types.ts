import type { BaseProps } from '../../base/types';

export interface SkeletonProps extends BaseProps {
    /** `'rectangle'` (the default) or `'circle'`, which also makes width and height equal. */
    shape?: 'rectangle' | 'circle';
    /** Any CSS length. Defaults to the full width of the space it is in. */
    width?: string;
    /** Any CSS length. Defaults to one line. */
    height?: string;
    borderRadius?: string;
    /** The sweep across the box. On by default, and off under `prefers-reduced-motion`. */
    animated?: boolean;
}
