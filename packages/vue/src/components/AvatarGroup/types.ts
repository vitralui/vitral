import type { BaseProps } from '../../base/types';

export interface AvatarGroupProps extends BaseProps {
    /** Names the group for assistive technology: “Reviewers”, “Attendees”. */
    label?: string;
}

export interface AvatarGroupSlots {
    default?: () => unknown;
}
