import type { BaseProps, IconProp } from '../../base/types';

export type AvatarSize = 'large' | 'xlarge';

export interface AvatarProps extends BaseProps {
    /** Initials, or any short text. Ignored when `image` is set. */
    label?: string;
    /** An image source. It fills the box and is cropped to it. */
    image?: string;
    /** The image's alternative text. Empty — the default — marks it decorative, which it is when a name sits beside it. */
    alt?: string;
    icon?: IconProp;
    size?: AvatarSize;
    /** `'square'` (the default) or `'circle'`. */
    shape?: 'square' | 'circle';
}

export interface AvatarSlots {
    default?: () => unknown;
}
