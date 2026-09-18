import type { BaseProps, IconProp } from '../../base/types';

export interface ChipProps extends BaseProps {
    label?: string;
    icon?: IconProp;
    /** An image shown before the label — a face, a logo. */
    image?: string;
    /** The image's alternative text. Empty marks it decorative, which it is beside a label. */
    imageAlt?: string;
    /** Adds a remove button, named “Remove <label>”. */
    removable?: boolean;
    removeIcon?: IconProp;
}

export type ChipEmits = {
    remove: [event: Event];
};

export interface ChipSlots {
    default?: () => unknown;
    icon?: () => unknown;
    removeicon?: () => unknown;
}
