import type { BaseProps } from '../../base/types';

export interface InputGroupProps extends BaseProps {
    /** Names the group when it holds more than one control: a range, an amount and its unit. */
    label?: string;
}

export interface InputGroupSlots {
    default?: () => unknown;
}
