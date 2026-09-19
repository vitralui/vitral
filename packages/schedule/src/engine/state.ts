import {
    addDays,
    addMinutes,
    dayDiff,
    expandEvents,
    formatDate,
    formatMessage,
    formatTime,
    isBusinessTime,
    isSameDay,
    minutesOfDay,
    parseTime,
    snapMinutes,
    startOfDay,
    viewRange,
    type Locale
} from '@vitral/core';
import type { Occurrence, ScheduleCell, ScheduleConfig, ScheduleEvent, ScheduleModels, ScheduleOccurrenceInfo, ScheduleResource, ScheduleViewName } from './types';

/**
 * What a schedule shows, worked out from what it was told: which views it
 * offers, which period is on, which days that is, and what is on in it. All of
 * it is a function of the configuration and the state — no DOM, no timers — so
 * the renderer only draws the answer and the same answer can be tested alone.
 */

export const DEFAULT_VIEWS: ScheduleViewName[] = ['month', 'week', 'day', 'agenda'];

export const defaultModels = (): ScheduleModels => ({ view: 'week', date: startOfDay(new Date()) });

/** The options with every default filled in, so nothing downstream repeats them. */
export interface ScheduleSettings {
    slotMinutes: number;
    timelineSlotMinutes: number;
    snap: number;
    minMinutes: number;
    maxMinutes: number;
    scrollMinutes: number;
    defaultDuration: number;
    agendaDays: number;
    timelineDays: number;
    maxEventsPerDay: number;
    editable: boolean;
    selectable: boolean;
    nowIndicator: boolean;
    firstDay: number;
    scrollHeight: string;
}

export function settingsOf(config: ScheduleConfig, locale: Locale): ScheduleSettings {
    const minMinutes = Math.max(0, Math.min(1439, parseTime(config.minTime, 0)));
    return {
        slotMinutes: Math.max(1, config.slotDuration ?? 30),
        timelineSlotMinutes: Math.max(1, config.timelineSlotDuration ?? 60),
        snap: Math.max(1, config.snapDuration ?? 15),
        minMinutes,
        maxMinutes: Math.max(minMinutes + 1, Math.min(1440, parseTime(config.maxTime, 1440))),
        scrollMinutes: parseTime(config.scrollTime, 480),
        defaultDuration: config.defaultDuration ?? 60,
        agendaDays: config.agendaDays ?? 7,
        timelineDays: config.timelineDays ?? 1,
        maxEventsPerDay: Math.max(1, config.maxEventsPerDay ?? 3),
        editable: config.editable ?? true,
        selectable: config.selectable ?? true,
        nowIndicator: config.nowIndicator ?? true,
        firstDay: config.firstDayOfWeek ?? locale.firstDayOfWeek,
        scrollHeight: config.scrollHeight ?? '36rem'
    };
}

/** The views on offer: what was asked for, or the usual four, with the timeline when there are resources. */
export function viewsOf(config: ScheduleConfig): ScheduleViewName[] {
    if (config.views?.length) return config.views;
    return config.resources?.length ? [...DEFAULT_VIEWS, 'timeline'] : DEFAULT_VIEWS;
}

/** How many days a view spans, where it is the reader's to choose. */
export const daysFor = (view: ScheduleViewName, settings: ScheduleSettings): number | undefined =>
    view === 'agenda' ? settings.agendaDays : view === 'timeline' ? settings.timelineDays : undefined;

/** A view whose rows are time, rather than whole days. */
export const isTimed = (view: ScheduleViewName): boolean => view === 'week' || view === 'day' || view === 'timeline';

export const rangeOf = (config: ScheduleConfig, models: ScheduleModels, settings: ScheduleSettings): { start: Date; end: Date } =>
    viewRange(models.view, models.date, { firstDayOfWeek: settings.firstDay, days: daysFor(models.view, settings) });

export const daysOf = (range: { start: Date; end: Date }): Date[] => Array.from({ length: dayDiff(range.start, range.end) }, (_, index) => addDays(range.start, index));

/** The period on show, in the words the locale gives it. */
export function titleOf(view: ScheduleViewName, date: Date, range: { start: Date; end: Date }, locale: Locale): string {
    const words = locale.schedule;
    const last = addDays(range.end, -1);
    if (view === 'month') return formatDate(date, words.monthTitle, locale);
    if (isSameDay(range.start, last)) return formatDate(range.start, words.dayTitle, locale);
    return formatMessage(words.range, { start: formatDate(range.start, words.rangeDate, locale), end: formatDate(last, words.rangeDate, locale) });
}

/** What a change to an occurrence looks like before it is told to anyone. */
export interface Override {
    start: Date;
    end: Date;
    allDay: boolean;
    resourceId?: string | number | null;
}

/** Everything on in the period, with whatever the reader has moved since. */
export function occurrencesOf(config: ScheduleConfig, range: { start: Date; end: Date }, settings: ScheduleSettings, overrides: Map<string, Override>): Occurrence[] {
    return expandEvents(config.events ?? [], range.start, range.end, settings.defaultDuration).map((occurrence) => {
        const override = overrides.get(occurrence.key);
        return override ? { ...occurrence, ...override } : occurrence;
    });
}

export const resourceIndexOf = (resources: readonly ScheduleResource[], id: string | number | null | undefined): number => resources.findIndex((resource) => resource.id === id);

/** An event's colour: its own, its resource's, or the chart palette by position. */
export function colorOf(occurrence: Occurrence, resources: readonly ScheduleResource[]): string {
    if (occurrence.event.color) return occurrence.event.color;
    const index = resourceIndexOf(resources, occurrence.resourceId);
    if (index >= 0 && resources[index]!.color) return resources[index]!.color!;
    return `var(--vt-chart-${((index >= 0 ? index : occurrence.index) % 8) + 1})`;
}

export const infoOf = (occurrence: Occurrence): ScheduleOccurrenceInfo => ({
    event: occurrence.event,
    start: occurrence.start,
    end: occurrence.end,
    allDay: occurrence.allDay,
    resourceId: occurrence.resourceId,
    recurring: occurrence.recurring,
    key: occurrence.key
});

/** The words for when something is on, which is most of what a reader hears. */
export function whenText(start: Date, end: Date, allDay: boolean, locale: Locale, hour12?: boolean): string {
    const words = locale.schedule;
    const time = (date: Date) => formatTime(date, locale.code, hour12);
    const day = (date: Date) => formatDate(date, words.dayTitle, locale);
    if (allDay) {
        const last = addDays(end, -1);
        return isSameDay(start, last) || last < start
            ? formatMessage(words.allDayWhen, { date: day(start) })
            : formatMessage(words.allDayRangeWhen, { start: day(start), end: day(last) });
    }
    const endText = isSameDay(start, end) || (minutesOfDay(end) === 0 && dayDiff(start, end) === 1) ? time(end) : `${day(end)} ${time(end)}`;
    return formatMessage(words.timedWhen, { date: day(start), start: time(start), end: endText });
}

export const titleTextOf = (occurrence: Occurrence, locale: Locale): string => (occurrence.event.title ? String(occurrence.event.title) : locale.schedule.untitled);

/** An event's name for a reader who cannot see where it sits. */
export function labelOf(occurrence: Occurrence, view: ScheduleViewName, resources: readonly ScheduleResource[], locale: Locale, hour12?: boolean): string {
    const words = locale.schedule;
    let when = whenText(occurrence.start, occurrence.end, occurrence.allDay, locale, hour12);
    if (occurrence.recurring) when = `${when}, ${words.recurring}`;
    const title = titleTextOf(occurrence, locale);
    const resource = view === 'timeline' ? resources[resourceIndexOf(resources, occurrence.resourceId)]?.title : undefined;
    return resource ? formatMessage(words.eventResourceLabel, { title, when, resource }) : formatMessage(words.eventLabel, { title, when });
}

export const timeTextOf = (occurrence: Occurrence, locale: Locale, hour12?: boolean): string =>
    occurrence.allDay ? '' : `${formatTime(occurrence.start, locale.code, hour12)} – ${formatTime(occurrence.end, locale.code, hour12)}`;

export const isEditable = (occurrence: Occurrence, settings: ScheduleSettings): boolean => occurrence.event.editable ?? settings.editable;

export const isBusiness = (start: Date, end: Date, config: ScheduleConfig): boolean => isBusinessTime(start, end, config.businessHours ?? {});

/** Where the tab stop goes when a view opens: the working hour, inside the hours on show. */
export function focusTimeOf(day: Date, settings: ScheduleSettings): Date {
    const minutes = snapMinutes(Math.min(Math.max(settings.scrollMinutes, settings.minMinutes), settings.maxMinutes - settings.slotMinutes), settings.slotMinutes);
    return addMinutes(startOfDay(day), minutes);
}

/** A cell's name: the day, the time, and the resource where there is one. */
export function cellLabel(cell: ScheduleCell, view: ScheduleViewName, resources: readonly ScheduleResource[], locale: Locale, hour12?: boolean): string {
    const day = formatDate(cell.start, locale.schedule.dayTitle, locale);
    const resource = view === 'timeline' ? resources[cell.resource]?.title : undefined;
    const text = cell.allDay ? day : `${day}, ${formatTime(cell.start, locale.code, hour12)}`;
    return resource ? `${resource}, ${text}` : text;
}

/** The range two cells cover, from the one the reader anchored to the one they are on. */
export function selectionOf(anchor: ScheduleCell, head: ScheduleCell): { start: Date; end: Date; allDay: boolean; resource: number } {
    const start = anchor.start < head.start ? anchor.start : head.start;
    const anchorEnd = addMinutes(anchor.start, anchor.span);
    const headEnd = addMinutes(head.start, head.span);
    return { start, end: anchorEnd > headEnd ? anchorEnd : headEnd, allDay: anchor.allDay, resource: anchor.resource };
}

export const sameCell = (cell: ScheduleCell, at: { start: Date; resource: number }, view: ScheduleViewName): boolean =>
    cell.start.getTime() === at.start.getTime() && (view !== 'timeline' || cell.resource === at.resource);

/** Whether a cell is inside the range being selected. */
export function cellSelected(cell: ScheduleCell, selection: { start: Date; end: Date; allDay: boolean; resource: number } | null, view: ScheduleViewName): boolean {
    if (!selection || selection.allDay !== cell.allDay || (view === 'timeline' && selection.resource !== cell.resource)) return false;
    return cell.start >= selection.start && addMinutes(cell.start, cell.span) <= selection.end;
}

/** The events on one day, in order, as the agenda and the "+N more" list read them. */
export function eventsOnDay(occurrences: readonly Occurrence[], day: Date): Occurrence[] {
    const end = addDays(day, 1);
    return occurrences.filter((occurrence) => occurrence.start < end && occurrence.end > day);
}

/** The later of two dates: an end that may not cross its start. */
export const maxDate = (a: Date, b: Date): Date => (a > b ? a : b);

export type { ScheduleEvent };
