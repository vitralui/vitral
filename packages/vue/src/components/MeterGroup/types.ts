import type { BaseProps, IconProp } from '../../base/types';

export interface MeterItem {
    label: string;
    value: number;
    /** Any CSS colour. Defaults to the theme's chart colours, in order. */
    color?: string;
    icon?: IconProp;
}

export interface MeterGroupProps extends BaseProps {
    value?: MeterItem[];
    /** Defaults to 0. */
    min?: number;
    /** Defaults to 100. */
    max?: number;
    orientation?: 'horizontal' | 'vertical';
    /** The legend after the track (the default) or before it. */
    labelPosition?: 'start' | 'end';
    /** How the legend is laid out. Defaults to across, or down for a vertical meter. */
    labelOrientation?: 'horizontal' | 'vertical';
    /** How a value is written, in the legend and to assistive technology. `{value}` is a percentage. Defaults to `'{value}%'`. */
    valueTemplate?: string;
}

export interface MeterGroupSlots {
    /** Replaces the legend. */
    label?: (props: { value: MeterItem[]; totalPercent: number; percentages: number[] }) => unknown;
    /** An item's icon or marker. */
    icon?: (props: { value: MeterItem; index: number }) => unknown;
    start?: (props: { totalPercent: number }) => unknown;
    end?: (props: { totalPercent: number }) => unknown;
}
