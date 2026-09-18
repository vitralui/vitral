import type { DateRange } from '@vitral/core';
import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

/**
 * What the component is bound to. It is core's `DateRange` under another name,
 * because the component is called `DateRange` too and one module cannot export
 * a component and a type under the same one — and `Range` is taken by the DOM.
 */
export type DateRangeValue = DateRange;

export interface DateRangeProps extends BaseProps {
    /**
     * How many months to show side by side. Two is the default and the reason
     * this component exists: a span that crosses a month boundary is chosen in
     * one gesture rather than by paging. One shows the same range in a single
     * calendar.
     */
    months?: number;
    /** A `formatDate` pattern; defaults to the locale's `dateFormat`. */
    dateFormat?: string;
    /** Between the two dates in the text box. */
    separator?: string;
    minDate?: Date | null;
    maxDate?: Date | null;
    disabledDates?: Date[];
    /** Weekdays that cannot be chosen, 0 = Sunday. */
    disabledDays?: number[];
    /** A footer button that empties the range. */
    showClearButton?: boolean;
    /** 0 = Sunday; defaults to the locale's `firstDayOfWeek`. */
    firstDayOfWeek?: number;
    placeholder?: string;
    /** Show the calendars in place, without a text box or popup. */
    inline?: boolean;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type DateRangeEmits = {
    /** Both ends are down. Fires once a range is whole, not on the first press. */
    rangeSelect: [range: DateRangeValue];
    clear: [];
    show: [];
    hide: [];
    monthChange: [event: { month: number; year: number }];
};

export interface DateRangeSlots {
    /** A day's content. */
    date?: (props: { date: Date; day: number; today: boolean; inRange: boolean; end: 'start' | 'end' | null; disabled: boolean; otherMonth: boolean }) => unknown;
    /** Under the calendars: presets, a count of nights, a pair of buttons. */
    footer?: (props: { range: DateRangeValue; nights: number; clear: () => void }) => unknown;
}
