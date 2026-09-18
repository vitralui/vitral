import type { BaseProps } from '../../base/types';

export interface FloatLabelProps extends BaseProps {
    /**
     * - `over` (the default): the label lifts onto the field's border.
     * - `in`: it stays inside, above the value.
     * - `on`: it parks on the border without the field growing.
     */
    variant?: 'over' | 'in' | 'on';
    invalid?: boolean;
    /**
     * Lift the label although the control has no placeholder to read. Native
     * fields are detected from `:placeholder-shown`; a select or a date picker
     * has no such state, so its wrapper is told.
     */
    filled?: boolean;
}

export interface FloatLabelSlots {
    /** The control and its `<label>`, in that order. */
    default?: () => unknown;
}
