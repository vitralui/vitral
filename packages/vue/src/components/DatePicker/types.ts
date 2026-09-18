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
    /** A day was chosen in the calendar, or typed and committed. */
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
