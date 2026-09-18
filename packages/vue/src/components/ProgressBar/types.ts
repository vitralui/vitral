import type { BaseProps } from '../../base/types';

export interface ProgressBarProps extends BaseProps {
    /** 0–100. */
    value?: number;
    /** `'determinate'` (the default) or `'indeterminate'`, for work of unknown length. */
    mode?: 'determinate' | 'indeterminate';
    /** Show the value beside the bar. Defaults to true. */
    showValue?: boolean;
    /** Follows the value in the label. Defaults to `'%'`. */
    unit?: string;
}

export interface ProgressBarSlots {
    /** Replaces the value label. */
    default?: (props: { value: number }) => unknown;
}
