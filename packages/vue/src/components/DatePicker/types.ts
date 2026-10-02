import type { MaskProp } from '@vitral/core';
import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface DatePickerProps extends BaseProps {
    /** A `formatDate` pattern (`yyyy yy MMMM MMM MM M dd d`); defaults to the locale's `dateFormat`. */
    dateFormat?: string;
    /** The earliest selectable day. */
    minDate?: Date | null;
    /** The latest selectable day. */
    maxDate?: Date | null;
    /** Days that cannot be chosen. */
    disabledDates?: Date[];
    /** Weekdays that cannot be chosen, 0 = Sunday. */
    disabledDays?: number[];
    /** A footer button that selects today. */
    showTodayButton?: boolean;
    /** A footer button that empties the value. */
    showClearButton?: boolean;
    /**
     * Whether the month in the calendar's title opens a grid of the twelve
     * months. On by default; off, the month is only text and is reached by
     * paging.
     */
    monthPicker?: boolean;
    /**
     * Whether the year in the calendar's title opens a grid of years. On by
     * default; off, the year is only text. With the month grid off as well,
     * the calendar can only be paged a month at a time.
     */
    yearPicker?: boolean;
    /**
     * Take a time of day with the date. The calendar gains a time field under
     * its days, the text box writes the time after the date and reads one
     * typed there, and choosing a day keeps the calendar open for the time.
     * Off by default.
     */
    showTime?: boolean;
    /** Minutes between the times the time field offers. Defaults to 30; any minute can still be typed. */
    timeStep?: number;
    /** The earliest time of day, as minutes past midnight or `'08:00'`. A time chosen or typed before it is moved up to it. */
    minTime?: number | string | null;
    /** The latest time of day, likewise. */
    maxTime?: number | string | null;
    /** Force twelve- or twenty-four-hour time; defaults to what the locale writes. */
    hour12?: boolean;
    /**
     * Whether the text box types into the shape the date is written in. On by
     * default: a `dateFormat` of fixed width (`dd/MM/yyyy`, `yyyy-MM-dd`, with
     * a twenty-four-hour time after it) gives `99/99/9999`, and a format with
     * a month name or a day without its zero gives none. `false` leaves the
     * box free; a mask of your own, as InputMask takes, replaces the derived
     * one.
     */
    mask?: boolean | MaskProp;
    /** 0 = Sunday; defaults to the locale's `firstDayOfWeek`. */
    firstDayOfWeek?: number;
    placeholder?: string;
    /** Show the calendar in place, without a text box or popup. */
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

export interface DatePickerMonthChangeEvent {
    /** 0-based, as in `Date`. */
    month: number;
    year: number;
}

export type DatePickerEmits = {
    /** A day was chosen in the calendar, or typed and committed; with `showTime`, also a time. */
    dateSelect: [date: Date];
    clear: [];
    show: [];
    hide: [];
    monthChange: [event: DatePickerMonthChangeEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface DatePickerDateSlotProps {
    date: Date;
    day: number;
    today: boolean;
    selected: boolean;
    disabled: boolean;
    otherMonth: boolean;
}

export interface DatePickerSlots {
    /** The content of one day cell. */
    date?: (props: DatePickerDateSlotProps) => unknown;
    /** Extra content in the calendar's footer. */
    footer?: () => unknown;
    /** The calendar button's icon. */
    dropdownicon?: () => unknown;
}
