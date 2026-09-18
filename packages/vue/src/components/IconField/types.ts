import type { BaseProps, IconProp } from '../../base/types';

export interface IconFieldProps extends BaseProps {
    /** Take the full width of the container. */
    fluid?: boolean;
}

export interface IconFieldSlots {
    /** An `<InputIcon>` before the field puts the icon at the start; after it, at the end. */
    default?: () => unknown;
}

export interface InputIconProps extends BaseProps {
    /** A built-in icon name, an icon definition, or a class for an icon font. */
    icon?: IconProp;
    /** Makes the icon meaningful and names it. Without one it is decorative. */
    label?: string;
    /** Spins the icon — for a loading indicator. */
    spin?: boolean;
}

export interface InputIconSlots {
    /** Replaces the icon. */
    default?: () => unknown;
}
