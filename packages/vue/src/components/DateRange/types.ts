import type { DateRange, MaskProp } from '@vitral/core';
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
    /**
     * Whether the days either side of each month are drawn. Left unset, they
     * are on a single calendar and off on several: with two months side by
     * side the last days of one are the first days of the next, so the same
     * date appears twice, a range paints across both copies, and the boundary
     * between the calendars stops meaning anything. The cells stay — the grid
     * keeps its six rows and its height — they are simply left empty.
     */
    showOtherMonths?: boolean;
    /** A `formatDate` pattern; defaults to the locale's `dateFormat`. */
    dateFormat?: string;
    /** Between the two dates in the text box. */
    separator?: string;
    /**
     * Whether a range can be typed into the text box: two dates with the
     * separator between them, each with its time under `showTime`, read on
     * Enter or when the box is left. On by default; off, the box only shows
     * the range and a press on it opens the calendars.
     */
    manualInput?: boolean;
    /**
     * Whether the text box types into the shape the range is written in. On by
     * default, for a `dateFormat` of fixed width: `99/99/9999 – 99/99/9999`.
     * `false` leaves the box free; a mask of your own, as InputMask takes,
     * replaces the derived one.
     */
    mask?: boolean | MaskProp;
    minDate?: Date | null;
    maxDate?: Date | null;
    disabledDates?: Date[];
    /** Weekdays that cannot be chosen, 0 = Sunday. */
    disabledDays?: number[];
    /**
     * Whether the month in each calendar's title opens a grid of the twelve
     * months. On by default; off, the month is only text and is reached by
     * paging.
     */
    monthPicker?: boolean;
    /**
     * Whether the year in each calendar's title opens a grid of years. On by
     * default; off, the year is only text. With the month grid off as well,
     * the calendars can only be paged a month at a time.
     */
    yearPicker?: boolean;
    /**
     * Take a time of day with each end. The calendars gain a time field for
     * the start and one for the end, the text box writes each time after its
     * date, and closing the range leaves the calendars open for the times.
     * A time field waits for its end to be chosen. Off by default.
     */
    showTime?: boolean;
    /** Minutes between the times the time fields offer. Defaults to 30; any minute can still be typed. */
    timeStep?: number;
    /** The earliest time of day, as minutes past midnight or `'08:00'`. A time chosen or typed before it is moved up to it. */
    minTime?: number | string | null;
    /** The latest time of day, likewise. */
    maxTime?: number | string | null;
    /** Force twelve- or twenty-four-hour time; defaults to what the locale writes. */
    hour12?: boolean;
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
    /** Both ends are down. Fires once a range is whole, not on the first press; with `showTime`, also when a time changes. */
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
