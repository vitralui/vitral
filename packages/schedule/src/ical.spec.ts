import { afterEach, describe, expect, it, vi } from 'vitest';
import { foldLine, icalText, toICalendar } from './engine/ical';
import { createSchedule, type ScheduleHandle } from './schedule';

const now = new Date(Date.UTC(2026, 8, 20, 12, 0, 0));
const lines = (text: string) => text.split('\r\n').filter(Boolean);

describe('an iCalendar file', () => {
    it('writes timed events as floating local times, and all-day ones as dates', () => {
        const text = toICalendar(
            [
                { id: 1, title: 'Standup', start: '2026-09-14T09:00', end: '2026-09-14T09:15' },
                { id: 'trip', title: 'Trip', start: '2026-09-18', end: '2026-09-20', allDay: true }
            ],
            { now, name: 'Team' }
        );
        expect(text.endsWith('\r\n')).toBe(true);
        expect(lines(text)).toEqual([
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Vitral//Schedule//EN',
            'CALSCALE:GREGORIAN',
            'X-WR-CALNAME:Team',
            'BEGIN:VEVENT',
            'UID:1@vitral',
            'DTSTAMP:20260920T120000Z',
            'DTSTART:20260914T090000',
            'DTEND:20260914T091500',
            'SUMMARY:Standup',
            'END:VEVENT',
            'BEGIN:VEVENT',
            'UID:trip@vitral',
            'DTSTAMP:20260920T120000Z',
            'DTSTART;VALUE=DATE:20260918',
            'DTEND;VALUE=DATE:20260920',
            'SUMMARY:Trip',
            'END:VEVENT',
            'END:VCALENDAR'
        ]);
    });

    it('keeps a rule and its exceptions rather than expanding them, and gives an end to an event with none', () => {
        const text = toICalendar(
            [
                { id: 7, title: 'Gym', start: '2026-09-14T07:00', recurrence: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE', exdate: ['2026-09-16T07:00'] },
                { id: 8, title: 'Review', start: '2026-09-15T10:00', recurrence: { freq: 'DAILY', count: 3 }, location: 'Room 2', description: 'Bring notes; and, the plan' }
            ],
            { now, defaultDuration: 30 }
        );
        const all = lines(text);
        expect(all).toContain('DTEND:20260914T073000');
        expect(all).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE');
        expect(all).toContain('EXDATE:20260916T070000');
        expect(all).toContain('RRULE:FREQ=DAILY;COUNT=3');
        expect(all).toContain('LOCATION:Room 2');
        expect(all).toContain('DESCRIPTION:Bring notes\; and\\, the plan');
    });

    it('escapes text and folds long lines', () => {
        expect(icalText('a\\b\nc')).toBe('a\\\\b\\nc');
        const long = `SUMMARY:${'x'.repeat(100)}`;
        const folded = foldLine(long);
        expect(folded.split('\r\n').map((l) => l.length)).toEqual([75, 34]);
        expect(folded.replace(/\r\n /g, '')).toBe(long);
    });
});

describe('the schedule handle', () => {
    let handle: ScheduleHandle | null = null;
    afterEach(() => {
        handle?.destroy();
        handle = null;
        document.body.innerHTML = '';
    });

    it('writes its events, and hands them over as a file', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        handle = createSchedule(element, { view: 'week', date: new Date(2026, 8, 14), events: [{ id: 1, title: 'Standup', start: '2026-09-14T09:00' }], defaultDuration: 15 });
        expect(handle.toICalendar({ now })).toContain('DTEND:20260914T091500');

        const blobs: Blob[] = [];
        Object.assign(URL, { createObjectURL: vi.fn((b: Blob) => (blobs.push(b), 'blob:x')), revokeObjectURL: vi.fn() });
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            expect(this.download).toBe('team.ics');
        });
        handle.exportICS({ filename: 'team.ics' });
        expect(click).toHaveBeenCalledOnce();
        expect(blobs[0]!.type).toBe('text/calendar;charset=utf-8');
        click.mockRestore();
    });
});
