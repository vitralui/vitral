import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Schedule from './Schedule.vue';
import type { ScheduleEvent, ScheduleEventChange, ScheduleViewName } from './types';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const d = (m: number, day: number, hour = 0, min = 0) => new Date(2026, m - 1, day, hour, min);

function mountSchedule(props: Record<string, unknown> = {}, events: ScheduleEvent[] = []) {
    const view = ref<ScheduleViewName>((props.view as ScheduleViewName) ?? 'week');
    const date = ref(d(9, 16));
    const handlers = { change: vi.fn(), select: vi.fn(), dateClick: vi.fn(), eventClick: vi.fn(), range: vi.fn() };
    const wrapper = mountVt(
        defineComponent(() => () =>
            h(Schedule, {
                events,
                hour12: false,
                minTime: '08:00',
                maxTime: '12:00',
                ...props,
                view: view.value,
                'onUpdate:view': (v: unknown) => (view.value = v as ScheduleViewName),
                date: date.value,
                'onUpdate:date': (v: unknown) => (date.value = v as Date),
                onEventChange: handlers.change,
                onSelect: handlers.select,
                onDateClick: handlers.dateClick,
                onEventClick: handlers.eventClick,
                onRangeChange: handlers.range
            })
        )
    );
    const grid = () => document.querySelector<HTMLElement>('[role="grid"]')!;
    const active = () => grid().querySelector<HTMLElement>('[data-vt-slot][tabindex="0"]')!;
    const event = (title: string) => [...document.querySelectorAll<HTMLElement>('[data-vt-event]')].find((e) => e.getAttribute('aria-label')?.startsWith(title))!;
    const status = () => document.querySelector('[role="status"]')!.textContent;
    const button = (name: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name)!;
    return { wrapper, view, date, handlers, grid, active, event, status, button };
}

const standup: ScheduleEvent = { id: 'standup', title: 'Standup', start: d(9, 16, 9), end: d(9, 16, 9, 30) };
const review: ScheduleEvent = { id: 'review', title: 'Review', start: d(9, 16, 9), end: d(9, 16, 10) };
const offsite: ScheduleEvent = { id: 'offsite', title: 'Offsite', start: '2026-09-14', end: '2026-09-16', allDay: true };

describe('Schedule', () => {
    it('is a grid named by the week, with days as column headers and events named by their time', async () => {
        const { grid, event, handlers } = mountSchedule({}, [standup, review, offsite]);
        const title = document.getElementById(grid().getAttribute('aria-labelledby')!)!;
        expect(title.textContent).toBe('Sep 13, 2026 – Sep 19, 2026');
        expect(grid().querySelectorAll('[role="columnheader"]')).toHaveLength(8);
        expect(grid().querySelectorAll('[role="row"]')).toHaveLength(2 + 8);
        expect(event('Standup').getAttribute('aria-label')).toBe('Standup, Wednesday, September 16, 2026, 09:00 to 09:30');
        expect(event('Offsite').getAttribute('aria-label')).toBe('Offsite, Monday, September 14, 2026 to Tuesday, September 15, 2026, all day');
        expect(handlers.range).toHaveBeenCalledWith({ start: d(9, 13), end: d(9, 20), view: 'week' });
        // Overlapping events share the column.
        expect(event('Review').style.left).toBe('0%');
        expect(event('Standup').style.left).toMatch(/^50(\.0+)?%$/);
        expect(event('Standup').style.width).toContain('50');
        await expectNoA11yViolations();
    });

    it('moves the tab stop with the arrows and reports a date click on Enter', async () => {
        const { active, handlers } = mountSchedule();
        const first = active();
        expect(first.getAttribute('aria-label')).toBe('Wednesday, September 16, 2026, 08:00');
        first.focus();
        await press(first, 'ArrowDown');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Wednesday, September 16, 2026, 08:30');
        await press(active(), 'ArrowRight');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Thursday, September 17, 2026, 08:30');
        await press(active(), 'Enter');
        expect(handlers.dateClick).toHaveBeenCalledWith(expect.objectContaining({ date: d(9, 17, 8, 30), allDay: false }));
    });

    it('selects a range with Shift and the arrows', async () => {
        const { active, handlers, status } = mountSchedule();
        active().focus();
        await press(active(), 'ArrowDown', { shiftKey: true });
        await press(active(), 'ArrowDown', { shiftKey: true });
        expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(3);
        expect(status()).toBe('Selected Wednesday, September 16, 2026, 08:00 to 09:30');
        await press(active(), 'Enter');
        expect(handlers.select).toHaveBeenCalledWith(expect.objectContaining({ start: d(9, 16, 8), end: d(9, 16, 9, 30), allDay: false, via: 'keyboard' }));
        expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
    });

    it('pages with Page Down and the toolbar, and switches views', async () => {
        const { active, date, button, view, grid } = mountSchedule();
        active().focus();
        await press(active(), 'PageDown');
        expect(date.value).toEqual(d(9, 23));
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Wednesday, September 23, 2026, 08:00');
        button('Previous period').click();
        await nextTick();
        expect(date.value).toEqual(d(9, 16));
        const month = button('Month');
        expect(month.getAttribute('aria-pressed')).toBe('false');
        month.click();
        await nextTick();
        expect(view.value).toBe('month');
        expect(document.getElementById(grid().getAttribute('aria-labelledby')!)!.textContent).toBe('September 2026');
        expect(button('Month').getAttribute('aria-pressed')).toBe('true');
    });

    it('moves and resizes an event with Alt and the arrows, and can put it back', async () => {
        const { event, handlers, status } = mountSchedule({}, [standup]);
        event('Standup').focus();
        await press(event('Standup'), 'ArrowDown', { altKey: true });
        const change = handlers.change.mock.calls[0]![0] as ScheduleEventChange;
        expect(change).toMatchObject({ kind: 'move', start: d(9, 16, 9, 15), end: d(9, 16, 9, 45), via: 'keyboard' });
        expect(change.event).toBe(standup);
        await nextTick();
        expect(status()).toBe('Standup moved to Wednesday, September 16, 2026, 09:15 to 09:45');
        expect(document.activeElement).toBe(event('Standup'));
        expect(event('Standup').getAttribute('aria-label')).toContain('09:15 to 09:45');
        await press(event('Standup'), 'ArrowDown', { altKey: true, shiftKey: true });
        expect(handlers.change.mock.calls[1]![0]).toMatchObject({ kind: 'resize', start: d(9, 16, 9, 15), end: d(9, 16, 10) });
        (handlers.change.mock.calls[1]![0] as ScheduleEventChange).revert();
        await nextTick();
        expect(event('Standup').getAttribute('aria-label')).toContain('09:15 to 09:45');
        await press(event('Standup'), 'ArrowRight', { altKey: true });
        expect(handlers.change.mock.calls[2]![0]).toMatchObject({ start: d(9, 17, 9, 15) });
    });

    it('drags across empty time to select, and drags an event to move it', async () => {
        const { handlers, grid, event } = mountSchedule({}, [standup]);
        const cell = (hour: number, min: number) => grid().querySelector<HTMLElement>(`[data-vt-slot="${d(9, 17, hour, min).getTime()}"]`)!;
        let under: HTMLElement = cell(8, 0);
        document.elementsFromPoint = () => [under];
        for (const c of [cell(8, 0), cell(10, 0), cell(9, 0)]) c.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 20 }) as DOMRect;
        const at = (type: string, x = 5, y = 0) => new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0 });
        cell(8, 0).dispatchEvent(at('pointerdown'));
        under = cell(10, 0);
        document.dispatchEvent(at('pointermove', 5, 30));
        await nextTick();
        expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(5);
        document.dispatchEvent(at('pointerup', 5, 30));
        expect(handlers.select).toHaveBeenCalledWith(expect.objectContaining({ start: d(9, 17, 8), end: d(9, 17, 10, 30), via: 'pointer' }));

        const wed = grid().querySelector<HTMLElement>(`[data-vt-slot="${d(9, 16, 9).getTime()}"]`)!;
        wed.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 20 }) as DOMRect;
        under = wed;
        event('Standup').dispatchEvent(at('pointerdown'));
        under = cell(10, 0);
        document.dispatchEvent(at('pointermove', 5, 10));
        await nextTick();
        expect(event('Standup').classList.contains('vt-schedule-event-dragging')).toBe(true);
        document.dispatchEvent(at('pointerup', 5, 10));
        // The click that would end a real drag is swallowed until the next task.
        await settle();
        // Pressed at 9:00 on Wednesday, released half-way down 10:00 on Thursday.
        expect(handlers.change).toHaveBeenCalledWith(expect.objectContaining({ kind: 'move', start: d(9, 17, 10, 15), end: d(9, 17, 10, 45), via: 'pointer' }));
    });

    it('shows a month with recurring events and a "+N more" popover', async () => {
        const weekly: ScheduleEvent = { id: 'yoga', title: 'Yoga', start: d(9, 1, 7), end: d(9, 1, 8), recurrence: 'FREQ=WEEKLY;BYDAY=TU;COUNT=3' };
        const busy = [1, 2, 3, 4].map((n) => ({ id: `b${n}`, title: `Busy ${n}`, start: d(9, 24, 9 + n), end: d(9, 24, 10 + n) }));
        const { event, button, grid } = mountSchedule({ view: 'month' }, [weekly, ...busy]);
        expect(grid().querySelectorAll('[role="gridcell"]')).toHaveLength(42);
        expect([...document.querySelectorAll('[data-vt-event]')].filter((e) => e.getAttribute('aria-label')!.startsWith('Yoga'))).toHaveLength(3);
        expect(event('Yoga').getAttribute('aria-label')).toContain('repeats');
        const more = button('2 more events on Thursday, September 24, 2026');
        expect(more.textContent?.trim()).toBe('+2 more');
        more.click();
        await settle();
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog.getAttribute('aria-label')).toBe('Thursday, September 24, 2026');
        expect(dialog.querySelectorAll('[data-vt-event]')).toHaveLength(4);
        await expectNoA11yViolations();
    });

    it('moves the month focus by day and week, into the next month', async () => {
        const { active, date } = mountSchedule({ view: 'month' });
        expect(active().textContent).toContain('Wednesday, September 16, 2026');
        active().focus();
        await press(active(), 'ArrowDown');
        await press(active(), 'ArrowDown');
        await press(active(), 'ArrowDown');
        expect(document.activeElement?.textContent).toContain('Wednesday, October 7, 2026');
        expect(date.value).toEqual(d(10, 7));
    });

    it('lists an agenda by day, and says when there is nothing', async () => {
        const { wrapper } = mountSchedule({ view: 'agenda' }, [standup, offsite]);
        const headings = [...document.querySelectorAll('[role="heading"]')].map((e) => e.textContent?.trim());
        expect(headings).toEqual(['Wednesday, September 16, 2026']);
        await expectNoA11yViolations();
        wrapper.unmount();
        mountSchedule({ view: 'agenda', agendaDays: 1 }, []);
        expect(document.body.textContent).toContain('Nothing scheduled in this period');
    });

    it('lays resources out as timeline rows and moves an event between them', async () => {
        const resources = [
            { id: 'a', title: 'Room A' },
            { id: 'b', title: 'Room B' }
        ];
        const booking: ScheduleEvent = { id: 'k', title: 'Booking', start: d(9, 16, 9), end: d(9, 16, 10), resourceId: 'a' };
        const { grid, event, handlers, button } = mountSchedule({ view: 'timeline', resources }, [booking]);
        expect(button('Timeline')).toBeTruthy();
        const rowheaders = [...grid().querySelectorAll('[role="rowheader"]')].map((e) => e.textContent?.trim());
        expect(rowheaders).toEqual(['Room A', 'Room B']);
        expect(event('Booking').getAttribute('aria-label')).toBe('Booking, Wednesday, September 16, 2026, 09:00 to 10:00, Room A');
        expect(event('Booking').style.left).toMatch(/^25(\.0+)?%$/);
        event('Booking').focus();
        await press(event('Booking'), 'ArrowDown', { altKey: true });
        expect(handlers.change).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'b', start: booking.start }));
        await nextTick();
        expect(event('Booking').getAttribute('aria-label')).toContain('Room B');
        await expectNoA11yViolations();
    });

    it('uses the locale for names, dates and the first day of the week', async () => {
        const { ptBR } = await import('@vitral/core');
        mountVt(Schedule, { props: { date: d(9, 16), view: 'week', events: [standup] } }, { theme: 'none', locale: { ...ptBR, firstDayOfWeek: 1 } });
        const grid = document.querySelector('[role="grid"]')!;
        expect(document.getElementById(grid.getAttribute('aria-labelledby')!)!.textContent).toBe('14 de set de 2026 – 20 de set de 2026');
        expect(document.querySelector('[data-vt-event]')!.getAttribute('aria-label')).toBe('Standup, quarta-feira, 16 de setembro de 2026, das 09:00 às 09:30');
    });
});
