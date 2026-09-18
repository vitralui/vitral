import type { BaseProps, Size } from '../../base/types';

export interface LabelProps extends BaseProps {
    /** The `id` of the control this label names. */
    for?: string;
    /** Shows a required mark. The control itself must still say it is required (`required`, `aria-required`). */
    required?: boolean;
    /** Dims the label. Read from the control when it is left out. */
    disabled?: boolean;
    size?: Size;
}

export interface LabelSlots {
    default?: () => unknown;
    /** Replaces the required mark. */
    required?: () => unknown;
}
