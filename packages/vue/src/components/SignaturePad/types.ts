import type { BaseProps } from '../../base/types';

/** A stroke: the points a pointer passed, in the pad's own units, each with the pressure it was drawn with (0 to 1). */
export type SignaturePadStroke = ([x: number, y: number] | [x: number, y: number, pressure: number])[];

export interface SignaturePadProps extends BaseProps {
    /** The ink's colour; the theme's (the text colour) otherwise. */
    penColor?: string;
    /** The ink's width at middling pressure, in the pad's units. Defaults to the theme's, 2.5. */
    penWidth?: number;
    /**
     * How much the pressure changes the width, 0 to 1: at 0.5 the line runs
     * from half to one and a half times `penWidth`. The pressure is a pen's
     * own, or else worked out from the speed — slower is wider. 0 draws a
     * line of one width. Defaults to 0.5.
     */
    thinning?: number;
    /** How much of the hand's tremor is smoothed away, 0 to 1. Higher is smoother, and lags a little more. Defaults to 0.5. */
    smoothing?: number;
    /** Length over which each end of a stroke narrows to a point, in the pad's units: one for both, or `[start, end]`. Defaults to 0. */
    taper?: number | [start: number, end: number];
    /** Use a pen's own pressure where it reports one; false works it out from the speed for every device. Defaults to true. */
    pressure?: boolean;
    /** Points closer than this to the last one, in the pad's units, are left out. Defaults to 1.5. */
    minDistance?: number;
    /** Any CSS length; the theme's (`10rem`) otherwise. */
    height?: string;
    disabled?: boolean;
    /** Shows the signature, and takes no more ink. */
    readonly?: boolean;
    /** The words above the line while the pad is empty; the locale's "Sign here" otherwise. `false` for none. */
    placeholder?: string | false;
    /** The undo and clear buttons in the corner. Defaults to true. */
    showControls?: boolean;
}

export type SignaturePadEmits = {
    /** A stroke was started. */
    begin: [];
    /** A stroke was finished; the model has the signature with it. */
    end: [];
};
