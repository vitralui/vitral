import { addMinutes, formatICalDate, formatRecurrence, shiftDays, startOfDay, toDate, type RecurrenceRule } from '@vitral/core';
import type { ScheduleEvent } from './types';

/** How a schedule is written out as an iCalendar file. */
export interface ICalendarOptions {
    /** The calendar's name, which most apps show when the file is imported. */
    name?: string;
    /** Who wrote the file. Defaults to Vitral's. */
    prodId?: string;
    /** What a timed event with no end lasts, in minutes. Defaults to 60, as the schedule does. */
    defaultDuration?: number;
    /** The domain an event's UID is made unique with. Defaults to `vitral`. */
    uidDomain?: string;
    /** When the file was written; now, otherwise. */
    now?: Date;
}

/** RFC 5545's escaping for a text value: backslash, semicolon, comma and line breaks. */
export function icalText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** A content line folded at 75 characters, each continuation starting with a space. */
export function foldLine(line: string): string {
    if (line.length <= 75) return line;
    const parts = [line.slice(0, 75)];
    for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
    return parts.join('\r\n');
}

const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/**
 * The events as an iCalendar (`.ics`) file that Google Calendar, Outlook and
 * Apple Calendar import. Times are written as floating local times, since the
 * schedule's dates are local and it converts no time zones; an all-day event
 * is written as dates. A recurring event keeps its rule and its exceptions,
 * rather than being expanded, so the file stays as short as what was given.
 * `description` and `location`, when an event carries them as text, go in too.
 */
export function toICalendar(events: readonly ScheduleEvent[], options: ICalendarOptions = {}): string {
    const stamp = utcStamp(options.now ?? new Date());
    const domain = options.uidDomain ?? 'vitral';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${options.prodId ?? '-//Vitral//Schedule//EN'}`, 'CALSCALE:GREGORIAN'];
    if (options.name) lines.push(`X-WR-CALNAME:${icalText(options.name)}`);

    events.forEach((event, index) => {
        const start = toDate(event.start);
        if (!start) return;
        const allDay = !!event.allDay;
        let end = toDate(event.end ?? null);
        if (!end || end <= start) end = allDay ? shiftDays(startOfDay(start), 1) : addMinutes(start, options.defaultDuration ?? 60);
        const date = (d: Date) => (allDay ? `;VALUE=DATE:${formatICalDate(d, false)}` : `:${formatICalDate(d)}`);

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${icalText(String(event.id ?? `event-${index}`))}@${domain}`);
        lines.push(`DTSTAMP:${stamp}`);
        lines.push(`DTSTART${date(allDay ? startOfDay(start) : start)}`);
        lines.push(`DTEND${date(allDay ? startOfDay(end) : end)}`);
        lines.push(`SUMMARY:${icalText(event.title ?? '')}`);
        if (typeof event.description === 'string') lines.push(`DESCRIPTION:${icalText(event.description)}`);
        if (typeof event.location === 'string') lines.push(`LOCATION:${icalText(event.location)}`);
        if (event.recurrence) {
            const rule = typeof event.recurrence === 'string' ? event.recurrence.replace(/^RRULE:/i, '').trim() : formatRecurrence(event.recurrence as RecurrenceRule);
            if (rule) lines.push(`RRULE:${rule}`);
        }
        for (const excluded of event.exdate ?? []) {
            const day = toDate(excluded);
            if (day) lines.push(`EXDATE${date(day)}`);
        }
        lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.map(foldLine).join('\r\n') + '\r\n';
}
