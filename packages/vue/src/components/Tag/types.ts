import type { BaseProps, IconProp, Severity } from '../../base/types';

export interface TagProps extends BaseProps {
    value?: string | number;
    /** Defaults to `'primary'`. */
    severity?: Severity;
    icon?: IconProp;
    /** Pill-shaped. */
    rounded?: boolean;
    /** Add a remove button, named "Remove <value>"; pressing it (or Delete/Backspace on it) emits `remove`. */
    removable?: boolean;
}

export type TagEmits = {
    remove: [event: Event];
};

export interface TagSlots {
    /** Replaces the value text. */
    default?: () => unknown;
    icon?: () => unknown;
    removeicon?: () => unknown;
}
