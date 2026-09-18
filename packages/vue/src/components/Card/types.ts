import type { BaseProps } from '../../base/types';

export interface CardProps extends BaseProps {
    title?: string;
    subtitle?: string;
}

export interface CardSlots {
    /** Above the body, edge to edge: an image or a banner. */
    header?: () => unknown;
    /** Replaces the `title` text. */
    title?: () => unknown;
    /** Replaces the `subtitle` text. */
    subtitle?: () => unknown;
    default?: () => unknown;
    footer?: () => unknown;
}
