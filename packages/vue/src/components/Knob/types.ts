import type { BaseProps } from '../../base/types';

export interface KnobProps extends BaseProps {
    /** Defaults to 0. */
    min?: number;
    /** Defaults to 100. */
    max?: number;
    /** Defaults to 1. */
    step?: number;
    /** The dial's width and height, in pixels. Defaults to 100. */
    size?: number;
    /** The thickness of the arc, in pixels. Defaults to 14. */
    strokeWidth?: number;
    /** Show the value in the middle. Defaults to true. */
    showValue?: boolean;
    /** How the value is written, in the middle and to assistive technology: `'{value}%'`. Defaults to `'{value}'`. */
    valueTemplate?: string;
    /** Overrides the value arc's colour. */
    valueColor?: string;
    /** Overrides the track's colour. */
    rangeColor?: string;
    /** Overrides the text's colour. */
    textColor?: string;
    readonly?: boolean;
    disabled?: boolean;
}

export type KnobEmits = {
    /** The value was changed by the reader: a drag ended or a key was pressed. */
    change: [value: number];
};
