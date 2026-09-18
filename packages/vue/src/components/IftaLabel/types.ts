import type { BaseProps } from '../../base/types';

export interface IftaLabelProps extends BaseProps {
    invalid?: boolean;
}

export interface IftaLabelSlots {
    /** The control and its `<label>`, in that order. */
    default?: () => unknown;
}
