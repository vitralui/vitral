import type { BaseProps } from '../../base/types';

export interface BlockUIProps extends BaseProps {
    /** Block the region: it is veiled, busy, and out of reach of pointer and keyboard. */
    blocked?: boolean;
    /** Block the whole page instead of the wrapped region. */
    fullScreen?: boolean;
    /** What the veil says to assistive technology while blocked. Defaults to the locale's "Loading…". */
    label?: string;
}

export type BlockUIEmits = {
    block: [];
    unblock: [];
};

export interface BlockUISlots {
    /** The region that can be blocked. */
    default?: () => unknown;
    /** Shown on the veil: a spinner, a message. */
    mask?: () => unknown;
}
