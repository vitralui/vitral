import { ptBR } from '@vitral/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { ScheduleEvent } from './engine/types';
import { createSchedule, type ScheduleHandle } from './schedule';

// A Monday, so the week the tests read is the one they wrote.
const MONDAY = new Date(2026, 2, 9, 0, 0, 0);

const events: ScheduleEvent[] = [
    { id: 1, title: 'Standup', start: new Date(2026, 2, 9, 9, 0), end: new Date(2026, 2, 9, 9, 30) },
    { id: 2, title: 'Review', start: new Date(2026, 2, 10, 14, 0), end: new Date(2026, 2, 10, 15, 0) },
    { id: 3, title: 'Offsite', start: new Date(2026, 2, 11), end: new Date(2026, 2, 13), allDay: true },
    { id: 4, title: 'Retro', start: new Date(2026, 2, 12, 16, 0), end: new Date(2026, 2, 12, 17, 0), resourceId: 'b' }
];

const resources = [
    { id: 'a', title: 'Room A' },
    { id: 'b', title: 'Room B' }
];

let handle: ScheduleHandle | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createSchedule(element, { events, date: MONDAY, view: 'week', ariaLabel: 'Team', ...config });
    return {
        element,
        grid: () => element.querySelector<HTMLElement>('[role="grid"]')!,
        eventButtons: () => Array.from(element.querySelectorAll<HTMLButtonElement>('[data-vt-event]')),
        titles: () => Array.from(element.querySelectorAll('.vt-schedule-event-title')).map((el) => el.textContent),
        cells: () => Array.from(element.querySelectorAll<HTMLElement>('[data-vt-slot]')),
        tabCell: () => element.querySelector<HTMLElement>('[data-vt-slot][tabindex="0"]')!,
        title: () => element.querySelector('.vt-schedule-title')?.textContent?.trim(),
        status: () => element.querySelector('[role="status"]')?.textContent
    };
}

const key = (target: Element, k: string, options: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...options }));

beforeEach(() => {
    // Only the clock is pinned: axe waits on real timers, and faking those
    // leaves it waiting for ever.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 9, 10, 0));
});

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
    vi.useRealTimers();
});

describe('a schedule with no framework in it', () => {
    it('draws the week as a grid, named, with the days across it', () => {
        const { grid, element } = mount();
        expect(grid().getAttribute('role')).toBe('grid');
        expect(grid().getAttribute('aria-label')).toBe('Team');
        expect(element.querySelectorAll('[role="columnheader"]')).toHaveLength(8); // the gutter and seven days
        // The week the date falls in, which with this locale opens on Sunday.
        expect(element.querySelector('.vt-schedule-title')?.textContent).toContain('Mar 8');
    });

    it('shows what is on, each named by its title and its full time', () => {
        const { eventButtons, titles } = mount();
        expect(titles()).toEqual(expect.arrayContaining(['Standup', 'Review', 'Offsite']));
        const standup = eventButtons().find((button) => button.textContent?.includes('Standup'))!;
        expect(standup.getAttribute('aria-label')).toContain('Standup');
        expect(standup.getAttribute('aria-label')).toMatch(/9(:|h)/);
    });

    it('says what a toolbar button does, rather than leaving it to the browser', async () => {
        const { element } = mount();
        const button = element.querySelector<HTMLButtonElement>('.vt-schedule-toolbar button')!;
        // Not the browser's own `title`: that waits a second, wears the
        // system's colours and never appears for a keyboard.
        expect(button.getAttribute('title')).toBeNull();
        button.dispatchEvent(new MouseEvent('mouseenter'));
        vi.useRealTimers();
        await new Promise((resolve) => setTimeout(resolve, 450));
        const tip = document.querySelector('[role="tooltip"]');
        expect(tip?.textContent).toBe(button.getAttribute('aria-label'));
        expect(button.getAttribute('aria-describedby')).toBe(tip!.id);
    });

    it('moves a period at a time, and back to today', () => {
        const changed = vi.fn();
        const { title } = mount({ on: { change: changed, 'range-change': vi.fn() } });
        const before = title();
        handle!.next();
        expect(title()).not.toBe(before);
        expect(handle!.state().date.getDate()).toBe(16);
        handle!.prev();
        expect(title()).toBe(before);
        handle!.today();
        expect(handle!.state().date.getDate()).toBe(9);
        expect(changed).toHaveBeenCalled();
    });

    it('says which period is on show, once per period', () => {
        const ranges: { start: Date; view: string }[] = [];
        mount({ on: { 'range-change': (range: { start: Date; view: string }) => ranges.push(range) } });
        expect(ranges).toHaveLength(1);
        expect(ranges[0]!.start.getDate()).toBe(8);
        handle!.next();
        expect(ranges).toHaveLength(2);
        expect(ranges[1]!.start.getDate()).toBe(15);
        // Drawing again for the same period says nothing new.
        handle!.refresh();
        expect(ranges).toHaveLength(2);
    });

    it('switches views, and the toolbar says which one is on', () => {
        const { element } = mount();
        const button = (label: string) => Array.from(element.querySelectorAll<HTMLButtonElement>('.vt-schedule-views button')).find((b) => b.textContent?.trim() === label)!;
        expect(button('Week').getAttribute('aria-pressed')).toBe('true');
        button('Month').click();
        expect(handle!.state().view).toBe('month');
        expect(element.querySelector('.vt-schedule-grid-month')).not.toBeNull();
        expect(button('Month').getAttribute('aria-pressed')).toBe('true');
    });

    it('lists the days that have something on, in the agenda', () => {
        const { element } = mount({ view: 'agenda' });
        const days = Array.from(element.querySelectorAll('.vt-schedule-agenda-date')).map((el) => el.textContent?.trim());
        expect(days).toHaveLength(4); // Monday, Tuesday, and the two days of the offsite
        expect(element.querySelectorAll('.vt-schedule-agenda-item').length).toBeGreaterThan(3);
    });

    it('says when there is nothing on', () => {
        const { element } = mount({ view: 'agenda', events: [] });
        expect(element.querySelector('.vt-schedule-agenda-empty')?.textContent).toBe('Nothing scheduled in this period');
    });

    it('gives the timeline a row for each resource', () => {
        const { element } = mount({ view: 'timeline', resources, date: new Date(2026, 2, 12) });
        const rows = Array.from(element.querySelectorAll('.vt-schedule-resource'));
        expect(rows.map((row) => row.textContent?.trim())).toEqual(['Room A', 'Room B']);
        expect(element.querySelectorAll('[data-vt-event]')).toHaveLength(1);
    });

    it('speaks the locale it is given', () => {
        const { element } = mount({ locale: ptBR, view: 'agenda', events: [] });
        expect(element.querySelector('.vt-schedule-agenda-empty')?.textContent).toBe('Nada agendado neste período');
        expect(element.querySelector('.vt-schedule-title')?.textContent).toContain('9 de mar');
    });

    it('clears up after itself', () => {
        const { element } = mount();
        handle!.destroy();
        handle = null;
        expect(element.children).toHaveLength(0);
        expect(element.className).toBe('');
    });
});

describe('its keyboard', () => {
    it('holds one tab stop and moves it with the arrows', () => {
        const { tabCell, cells } = mount();
        expect(cells().filter((cell) => cell.getAttribute('tabindex') === '0')).toHaveLength(1);
        const from = new Date(Number(tabCell().dataset.vtSlot));
        key(tabCell(), 'ArrowDown');
        const to = new Date(Number(tabCell().dataset.vtSlot));
        expect((to.getTime() - from.getTime()) / 60_000).toBe(30);
        key(tabCell(), 'ArrowRight');
        expect(new Date(Number(tabCell().dataset.vtSlot)).getDate()).toBe(to.getDate() + 1);
    });

    it('picks a time with Enter, and reports it', () => {
        const clicked = vi.fn();
        const { tabCell } = mount({ on: { 'date-click': clicked } });
        key(tabCell(), 'Enter');
        expect(clicked).toHaveBeenCalledTimes(1);
        expect(clicked.mock.calls[0]![0].allDay).toBe(false);
    });

    it('selects a range with Shift and the arrows, and says what it covers', () => {
        const selected = vi.fn();
        const { tabCell, element, status } = mount({ on: { select: selected } });
        key(tabCell(), 'ArrowDown', { shiftKey: true });
        key(tabCell(), 'ArrowDown', { shiftKey: true });
        expect(element.querySelectorAll('[aria-selected="true"]').length).toBe(3);
        expect(status()).toContain('Selected');
        key(tabCell(), 'Enter');
        expect(selected).toHaveBeenCalledTimes(1);
        const chosen = selected.mock.calls[0]![0];
        expect((chosen.end.getTime() - chosen.start.getTime()) / 60_000).toBe(90);
        expect(chosen.via).toBe('keyboard');
        // Picking it puts the selection away.
        expect(element.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
    });

    it('gives up a selection on Escape', () => {
        const { tabCell, element } = mount();
        key(tabCell(), 'ArrowDown', { shiftKey: true });
        expect(element.querySelectorAll('[aria-selected="true"]').length).toBeGreaterThan(0);
        key(tabCell(), 'Escape');
        expect(element.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
    });

    it('changes the period with Page Up and Page Down', () => {
        const { tabCell } = mount();
        key(tabCell(), 'PageDown');
        expect(handle!.state().date.getDate()).toBe(16);
    });

    it('moves an event with Alt and an arrow, and says where it went', () => {
        const changed = vi.fn();
        const { eventButtons, status } = mount({ on: { 'event-change': changed } });
        const standup = eventButtons().find((button) => button.textContent?.includes('Standup'))!;
        key(standup, 'ArrowDown', { altKey: true });
        expect(changed).toHaveBeenCalledTimes(1);
        const change = changed.mock.calls[0]![0];
        expect(change.kind).toBe('move');
        expect(change.via).toBe('keyboard');
        expect(change.start.getHours() * 60 + change.start.getMinutes()).toBe(9 * 60 + 15);
        expect(status()).toContain('Standup');
        // And it stays where it was put.
        expect(handle!.element.querySelector('[data-vt-event]')).not.toBeNull();
        // Until the change is refused.
        change.revert();
        const again = eventButtons().find((button) => button.textContent?.includes('Standup'))!;
        expect(again.getAttribute('aria-label')).toBe(standup.getAttribute('aria-label'));
    });

    it('changes an event’s end with Alt, Shift and an arrow', () => {
        const changed = vi.fn();
        const { eventButtons } = mount({ on: { 'event-change': changed } });
        const review = eventButtons().find((button) => button.textContent?.includes('Review'))!;
        key(review, 'ArrowDown', { altKey: true, shiftKey: true });
        const change = changed.mock.calls[0]![0];
        expect(change.kind).toBe('resize');
        expect(change.start.getHours()).toBe(14);
        expect(change.end.getHours() * 60 + change.end.getMinutes()).toBe(15 * 60 + 15);
    });

    it('leaves an event alone when it is not editable', () => {
        const changed = vi.fn();
        const { eventButtons } = mount({ editable: false, on: { 'event-change': changed } });
        key(eventButtons()[0]!, 'ArrowDown', { altKey: true });
        expect(changed).not.toHaveBeenCalled();
    });
});

describe('its pointer', () => {
    const at = (type: string, x = 5, y = 0) =>
        new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0 });
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

    /** jsdom measures nothing, so the cells under the pointer are said outright. */
    function stub(cells: HTMLElement[]) {
        for (const cell of cells) cell.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 20 }) as DOMRect;
        let under = cells[0]!;
        document.elementsFromPoint = () => [under];
        return (cell: HTMLElement) => (under = cell);
    }

    it('drags across empty time to select it', () => {
        const selected = vi.fn();
        const { element } = mount({ minTime: '08:00', maxTime: '12:00', on: { select: selected } });
        const cell = (hour: number, minute: number) => element.querySelector<HTMLElement>(`[data-vt-slot="${new Date(2026, 2, 10, hour, minute).getTime()}"]`)!;
        const now = stub([cell(8, 0), cell(9, 0), cell(10, 0)]);
        cell(8, 0).dispatchEvent(at('pointerdown'));
        now(cell(10, 0));
        document.dispatchEvent(at('pointermove', 5, 30));
        expect(element.querySelectorAll('[aria-selected="true"]')).toHaveLength(5);
        document.dispatchEvent(at('pointerup', 5, 30));
        expect(selected).toHaveBeenCalledWith(expect.objectContaining({ start: new Date(2026, 2, 10, 8), end: new Date(2026, 2, 10, 10, 30), via: 'pointer' }));
    });

    it('drags an event to another time, showing it there at once', async () => {
        const changed = vi.fn();
        const { element, eventButtons } = mount({ minTime: '08:00', maxTime: '12:00', on: { 'event-change': changed } });
        const cell = (day: number, hour: number) => element.querySelector<HTMLElement>(`[data-vt-slot="${new Date(2026, 2, day, hour, 0).getTime()}"]`)!;
        const now = stub([cell(9, 9), cell(10, 10)]);
        const standup = () => eventButtons().find((button) => button.textContent?.includes('Standup'))!;
        standup().dispatchEvent(at('pointerdown'));
        now(cell(10, 10));
        document.dispatchEvent(at('pointermove', 5, 10));
        expect(standup().classList.contains('vt-schedule-event-dragging')).toBe(true);
        document.dispatchEvent(at('pointerup', 5, 10));
        await settle();
        // Pressed at 9:00 on Monday, released half-way down 10:00 on Tuesday.
        expect(changed).toHaveBeenCalledWith(expect.objectContaining({ kind: 'move', start: new Date(2026, 2, 10, 10, 15), end: new Date(2026, 2, 10, 10, 45), via: 'pointer' }));
        expect(standup().classList.contains('vt-schedule-event-dragging')).toBe(false);
    });

    it('presses empty time to report it', () => {
        const clicked = vi.fn();
        const { element } = mount({ minTime: '08:00', maxTime: '12:00', on: { 'date-click': clicked } });
        const cell = element.querySelector<HTMLElement>(`[data-vt-slot="${new Date(2026, 2, 10, 8, 0).getTime()}"]`)!;
        stub([cell]);
        cell.dispatchEvent(at('pointerdown'));
        document.dispatchEvent(at('pointerup'));
        expect(clicked).toHaveBeenCalledTimes(1);
        expect(clicked.mock.calls[0]![0].date).toEqual(new Date(2026, 2, 10, 8, 0));
    });
});

describe('a month with more than fits', () => {
    const busy = [1, 2, 3, 4].map((n) => ({ id: `b${n}`, title: `Busy ${n}`, start: new Date(2026, 2, 11, 9 + n), end: new Date(2026, 2, 11, 10 + n) }));

    it('offers the rest behind a button, and lists them in an overlay', async () => {
        const { element } = mount({ view: 'month', events: busy });
        const more = element.querySelector<HTMLButtonElement>('.vt-schedule-more-button')!;
        expect(more.textContent?.trim()).toBe('+2 more');
        expect(more.getAttribute('aria-label')).toContain('March 11, 2026');
        more.click();
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog.parentElement).toBe(document.body);
        expect(dialog.getAttribute('aria-label')).toContain('March 11, 2026');
        expect(dialog.querySelectorAll('[data-vt-event]')).toHaveLength(4);
        await expectNoA11yViolations(document.body);
        // Escape puts it away and the keyboard back on the button.
        more.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(more);
    });

    it('takes the overlay with it when it goes', () => {
        const { element } = mount({ view: 'month', events: busy });
        element.querySelector<HTMLButtonElement>('.vt-schedule-more-button')!.click();
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        handle!.destroy();
        handle = null;
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
});

describe('what it says to a reader who cannot see it', () => {
    // The hours are narrowed for the timed views: axe over a whole day of
    // half-hour cells is thousands of nodes, and the structure it checks is
    // the same at four hours as at twenty-four.
    const hours = { minTime: '08:00', maxTime: '12:00' };

    it.each(['week', 'day', 'month', 'agenda'] as const)('has nothing axe objects to, in the %s view', async (view) => {
        const { element } = mount({ view, ...hours });
        await expectNoA11yViolations(element);
    });

    it('has nothing axe objects to, in the timeline', async () => {
        const { element } = mount({ view: 'timeline', resources, date: new Date(2026, 2, 12), ...hours });
        await expectNoA11yViolations(element);
    });

    it('tells the reader what the keyboard does, where the grid points at it', () => {
        const { grid, element, eventButtons } = mount();
        const help = grid().getAttribute('aria-describedby')!;
        expect(element.querySelector(`#${help}`)?.textContent).toContain('arrow');
        const editable = eventButtons()[0]!;
        expect(element.querySelector(`#${editable.getAttribute('aria-describedby')}`)?.textContent).toContain('Alt');
    });

    describe('in a zone that is not the reader\'s', () => {
        // One instant, 15:00 UTC on the Monday. In Tokyo that is midnight on
        // Tuesday, which is a different column of the grid entirely.
        const instant = new Date(Date.UTC(2026, 2, 9, 15, 0));
        const oneEvent: ScheduleEvent[] = [{ id: 1, title: 'Handover', start: instant, end: new Date(instant.getTime() + 3600_000) }];

        it('draws an event at the hour and the day the zone reads, not the browser', () => {
            const utc = mount({ events: oneEvent, timeZone: 'UTC', view: 'day', date: new Date(2026, 2, 9) });
            expect(utc.titles()).toEqual(['Handover']);
            handle!.destroy();
            document.body.innerHTML = '';

            // Midnight in Tokyo is the next day, so the Monday shows nothing.
            const tokyo = mount({ events: oneEvent, timeZone: 'Asia/Tokyo', view: 'day', date: new Date(2026, 2, 9) });
            expect(tokyo.titles()).toEqual([]);
            handle!.destroy();
            document.body.innerHTML = '';

            const tuesday = mount({ events: oneEvent, timeZone: 'Asia/Tokyo', view: 'day', date: new Date(2026, 2, 10) });
            expect(tuesday.titles()).toEqual(['Handover']);
        });

        it('hands every date back as the instant it was, whatever it was drawn as', () => {
            const clicked: unknown[] = [];
            mount({
                events: oneEvent,
                timeZone: 'Asia/Tokyo',
                view: 'day',
                date: new Date(2026, 2, 10),
                on: { 'event-click': (e: { occurrence: { start: Date; end: Date } }) => clicked.push(e.occurrence) }
            });
            const button = document.querySelector<HTMLButtonElement>('[data-vt-event]')!;
            button.click();
            const shown = clicked[0] as { start: Date; end: Date };
            // Drawn at midnight in Tokyo, reported as the instant it always was.
            expect(shown.start.toISOString()).toBe(instant.toISOString());
            expect(shown.end.toISOString()).toBe(new Date(instant.getTime() + 3600_000).toISOString());
        });

        it('leaves an all-day event where it was put, since a date is not an instant', () => {
            const allDay: ScheduleEvent[] = [{ id: 1, title: 'Offsite', start: new Date(2026, 2, 11), end: new Date(2026, 2, 12), allDay: true }];
            const tokyo = mount({ events: allDay, timeZone: 'Asia/Tokyo', view: 'week', date: MONDAY });
            // Shifting it would move it into the column next door.
            expect(tokyo.titles()).toEqual(['Offsite']);
        });

        it('ignores a zone it does not know rather than drawing nothing', () => {
            const bad = mount({ events: oneEvent, timeZone: 'Mars/Olympus_Mons', view: 'week', date: MONDAY });
            expect(bad.titles()).toEqual(['Handover']);
        });
    });
});
