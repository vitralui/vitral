import type { BaseProps } from '../../base/types';

/** A number, or `[start, end]` for a range. */
export type SliderValue = number | number[];

export interface SliderProps extends BaseProps {
    /** Defaults to 0. */
    min?: number;
    /** Defaults to 100. */
    max?: number;
    /** Distance between neighbouring values; defaults to 1. 0 lets the thumb stop anywhere. */
    step?: number;
    /** Two thumbs: v-model is `[start, end]`, and the thumbs never cross. */
    range?: boolean;
    /** A vertical slider has its minimum at the bottom. */
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
    /** Text a screen reader announces for a value (`aria-valuetext`): "20 °C" rather than "20". */
    formatValue?: (value: number) => string;
    /**
     * The thumb's accessible name. For a range, one string names both thumbs
     * together with the locale's "minimum"/"maximum"; an array names each.
     */
    ariaLabel?: string | string[];
    /** Id(s) of the element(s) naming the thumbs; an array names each thumb of a range. */
    ariaLabelledby?: string | string[];
}

export interface SliderSlideEndEvent {
    originalEvent: PointerEvent;
    value: SliderValue;
}

export type SliderEmits = {
    /** The value was committed: after a key press, or when a drag ends having moved it. */
    change: [value: SliderValue];
    /** A pointer interaction ended. */
    slideend: [event: SliderSlideEndEvent];
};
