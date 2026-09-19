import type { ClassEntry, Locale, ScheduleOccurrence } from '@vitral/core';
import type { PassThrough } from '@vitral/dom';

/**
 * What a schedule is told, as plain data. Dates are local `Date`s (or ISO
 * strings read as local time): the scheduler does no time-zone conversion, so
 * an application that stores UTC converts before handing its events over and
 * converts what it is told back.
 */

export type ScheduleViewName = 'month' | 'week' | 'day' | 'agenda' | 'timeline';

export interface ScheduleRecurrenceRule {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval?: number;
    count?: number;
    until?: Date;
    byDay?: { day: number; nth?: number }[];
    byMonthDay?: number[];
    byMonth?: number[];
    weekStart?: number;
}

export interface ScheduleEvent {
    id?: string | number;
    title?: string;
    /** A `Date`, or an ISO string read as local time (`'2026-09-14'`, `'2026-09-14T09:00'`). */
    start: Date | string;
    /** Exclusive. Missing, a timed event lasts `defaultDuration`; an all-day one, its day. */
    end?: Date | string | null;
    allDay?: boolean;
    /** Any CSS colour; defaults to the chart palette, by resource or by position. */
    color?: string;
    /** The resource row it belongs to, in the timeline view. */
    resourceId?: string | number | null;
    /** False keeps it from being moved or resized; true allows it on a schedule that is not `editable`. */
    editable?: boolean;
    /** An RRULE (`'FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10'`), or the rule as an object. */
    recurrence?: string | ScheduleRecurrenceRule | null;
    /** Occurrences to leave out, by start, or by day for a bare date. */
    exdate?: (Date | string)[];
    [key: string]: unknown;
}

export interface ScheduleResource {
    id: string | number;
    title: string;
    color?: string;
}

export interface ScheduleBusinessHours {
    /** 0 = Sunday. Defaults to Monday to Friday. */
    daysOfWeek?: number[];
    /** `'09:00'` */
    startTime?: string;
    /** `'17:00'` */
    endTime?: string;
}

export type Occurrence = ScheduleOccurrence<ScheduleEvent>;

/** One cell of a grid: a slot, or a whole day. */
export interface ScheduleCell {
    start: Date;
    /** Minutes the cell spans: a slot, or a whole day (1440). */
    span: number;
    allDay: boolean;
    resource: number;
}

export interface ScheduleOccurrenceInfo {
    event: ScheduleEvent;
    start: Date;
    end: Date;
    allDay: boolean;
    resourceId?: string | number | null;
    /** One occurrence of a recurring event. */
    recurring: boolean;
    key: string;
}

export interface ScheduleEventChange {
    event: ScheduleEvent;
    occurrence: ScheduleOccurrenceInfo;
    kind: 'move' | 'resize';
    start: Date;
    end: Date;
    allDay: boolean;
    resourceId?: string | number | null;
    /** The schedule shows the change at once; call this to put the event back (it was refused, or it failed). */
    revert: () => void;
    via: 'pointer' | 'keyboard';
}

export interface ScheduleSelection {
    start: Date;
    /** Exclusive. */
    end: Date;
    allDay: boolean;
    resourceId?: string | number | null;
    via: 'pointer' | 'keyboard';
}

export interface ScheduleEvents {
    /** The visible range changed: the moment to fetch its events. */
    'range-change'?: (range: { start: Date; end: Date; view: ScheduleViewName }) => void;
    'event-click'?: (payload: { event: ScheduleEvent; occurrence: ScheduleOccurrenceInfo; originalEvent: Event }) => void;
    'event-change'?: (change: ScheduleEventChange) => void;
    select?: (selection: ScheduleSelection) => void;
    'date-click'?: (payload: { date: Date; allDay: boolean; resourceId?: string | number | null; originalEvent: Event }) => void;
    /** What the reader changed: the view they switched to, the date they moved to. */
    change?: (state: ScheduleModels) => void;
}

/** Content a host draws itself: a string, a node it made, or nothing. */
export type Content = string | number | Node | null | undefined;

export interface ToolbarContext {
    title: string;
    view: ScheduleViewName;
    views: ScheduleViewName[];
    date: Date;
    prev: () => void;
    next: () => void;
    today: () => void;
    setView: (view: ScheduleViewName) => void;
}

export interface EventContext {
    event: ScheduleEvent;
    occurrence: ScheduleOccurrenceInfo;
    /** The event's time, formatted. Empty for an all-day event. */
    timeText: string;
    view: ScheduleViewName;
}

/**
 * The parts a host draws itself. A framework component passes its slots
 * through here; a page with no framework hands in nodes it made, or nothing,
 * and the schedule draws its own.
 */
export interface ScheduleContent {
    /** The whole toolbar. */
    toolbar?: (context: ToolbarContext) => Content;
    /** One event's content, inside the button the schedule draws. */
    event?: (context: EventContext) => Content;
    /** A resource's row header in the timeline. */
    resource?: (context: { resource: ScheduleResource }) => Content;
    /** The agenda with nothing in it. */
    empty?: () => Content;
}

/** The parts of the state a host binds: what the reader can change. */
export interface ScheduleModels {
    view: ScheduleViewName;
    date: Date;
}

export interface ScheduleConfig extends Partial<ScheduleModels> {
    events?: ScheduleEvent[];
    /** Rows of the timeline view. */
    resources?: ScheduleResource[];
    /** The views the switcher offers, in order. Defaults to month, week, day and agenda, plus timeline when there are resources. */
    views?: ScheduleViewName[];
    /** The built-in toolbar. Defaults to true. */
    toolbar?: boolean;
    /** Minutes per row of the week and day views. Defaults to 30. */
    slotDuration?: number;
    /** Minutes the timeline's columns span. Defaults to 60. */
    timelineSlotDuration?: number;
    /** Minutes a drag or a key moves by. Defaults to 15. */
    snapDuration?: number;
    /** The first time shown, `'HH:mm'`. Defaults to `'00:00'`. */
    minTime?: string;
    /** The last time shown, `'HH:mm'`. Defaults to `'24:00'`. */
    maxTime?: string;
    /** Where the week and day views open scrolled to. Defaults to `'08:00'`. */
    scrollTime?: string;
    /** Shades the time outside them; false shades nothing. Defaults to Monday–Friday, 09:00–17:00. */
    businessHours?: ScheduleBusinessHours | ScheduleBusinessHours[] | false;
    /** 0 = Sunday; defaults to the locale's `firstDayOfWeek`. */
    firstDayOfWeek?: number;
    /** Force a 12- or 24-hour clock; defaults to the locale's. */
    hour12?: boolean;
    /** Events can be dragged and resized. Defaults to true. */
    editable?: boolean;
    /** Empty time can be dragged over to pick a range. Defaults to true. */
    selectable?: boolean;
    /** A line at the current time. Defaults to true. */
    nowIndicator?: boolean;
    /** Minutes a timed event without an end lasts. Defaults to 60. */
    defaultDuration?: number;
    /** Days the agenda lists. Defaults to 7. */
    agendaDays?: number;
    /** Days the timeline spans. Defaults to 1. */
    timelineDays?: number;
    /** Events shown in a month cell before "+N more". Defaults to 3. */
    maxEventsPerDay?: number;
    /** Height of the scrolling area of the week, day and timeline views. Defaults to `'36rem'`. */
    scrollHeight?: string;

    /** Names the grid, when the title is not enough. */
    ariaLabel?: string;
    ariaLabelledby?: string;

    locale?: Locale;
    /** Drop the built-in classes and stylesheet; style through `pt` or `classes` instead. */
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** What the host draws itself. */
    content?: ScheduleContent;
    /** Prefix of the ids the schedule gives its elements; generated when unset. */
    id?: string;
    /** For a Content-Security-Policy: the nonce of the injected stylesheet. */
    nonce?: string;
    /** A CSS cascade layer to put the stylesheet in. */
    cssLayer?: string | false;
    /**
     * Where overlays are put: an element, a selector, or a function giving
     * either. `'body'` and `'self'` mean the nearest overlay scope.
     */
    overlayTarget?: HTMLElement | string | (() => HTMLElement | string | null | undefined);
    /** The z-index overlays start from. */
    zIndex?: number;
    on?: ScheduleEvents;
}
