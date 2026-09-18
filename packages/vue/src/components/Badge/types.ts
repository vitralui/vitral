import type { BaseProps, Severity } from '../../base/types';

export type BadgeSize = 'small' | 'large' | 'xlarge';

export interface BadgeProps extends BaseProps {
    /** Without a value (or slot content) the badge is a dot. */
    value?: string | number | null;
    /** Defaults to `'primary'`. */
    severity?: Severity;
    size?: BadgeSize;
}

export interface BadgeSlots {
    default?: () => unknown;
}
