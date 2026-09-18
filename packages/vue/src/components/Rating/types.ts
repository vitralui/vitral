import type { BaseProps, IconProp } from '../../base/types';

export interface RatingProps extends BaseProps {
    /** How many stars. Defaults to 5. */
    stars?: number;
    /**
     * The smallest change: `1` whole stars, `0.5` halves, `0.25` quarters. A
     * whole-star rating is a radio group of stars, which is what it is; a
     * fractional one is a slider, because half a star is not an option in a
     * list, it is a position on a scale.
     */
    step?: number;
    /** A press on the chosen star clears the rating, and the arrow keys can reach zero. Defaults to true. */
    clearable?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** The icon of a chosen star. Defaults to a filled star. */
    onIcon?: IconProp;
    /** The icon of a star not chosen. Defaults to an outlined star. */
    offIcon?: IconProp;
}

export type RatingEmits = {
    change: [event: { originalEvent: Event; value: number | null }];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface RatingSlots {
    onicon?: (props: { value: number }) => unknown;
    officon?: (props: { value: number }) => unknown;
}
