import type { BaseProps, Severity } from '../../base/types';

export interface OverlayBadgeProps extends BaseProps {
    /** Without a value the badge is a dot. */
    value?: string | number | null;
    /** Defaults to `'primary'`. */
    severity?: Severity;
    size?: 'small' | 'large' | 'xlarge';
}

export interface OverlayBadgeSlots {
    /**
     * What the badge sits on. `badgeId` is the id of the badge's text for
     * assistive technology: bind it as `aria-describedby` on the control so
     * "Notifications" is announced with its count.
     */
    default?: (props: { badgeId: string | undefined }) => unknown;
}
