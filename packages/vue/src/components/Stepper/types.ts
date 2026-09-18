import type { BaseProps } from '../../base/types';

export type StepValue = string | number;

export interface StepperProps extends BaseProps {
    /** Only the steps up to the current one can be chosen; the panels move the reader on. */
    linear?: boolean;
}

export type StepListProps = BaseProps;

export interface StepProps extends BaseProps {
    /** Which step this is. Inside a StepItem, the item's value is used. */
    value?: StepValue;
    disabled?: boolean;
}

export type StepPanelsProps = BaseProps;

export interface StepPanelProps extends BaseProps {
    /** Which step this panel belongs to. Inside a StepItem, the item's value is used. */
    value?: StepValue;
}

export interface StepItemProps extends BaseProps {
    value: StepValue;
}

export interface StepperSlots {
    default?: () => unknown;
}

export interface StepSlots {
    /** The step's title. */
    default?: (props: { value: StepValue; index: number; active: boolean; done: boolean }) => unknown;
}

export interface StepPanelSlots {
    default?: (props: { value: StepValue; active: boolean; activateCallback: (value: StepValue) => void }) => unknown;
}
