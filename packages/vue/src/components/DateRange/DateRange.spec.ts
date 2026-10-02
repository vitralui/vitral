import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import DateRange from './DateRange.vue';
import type { DateRangeValue as Range } from './types';

const at = (day: number, month = 8) => new Date(2026, month, day);

function mountRange(props: Record<string, unknown> = {}) {
    const value = ref<Range>({ start: null, end: null });
    const selected: Range[] = [];
    const wrapper = mountVt(
        defineComponent(() => () =>
            h(DateRange, {
                ariaLabel: 'Stay',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: Range) => (value.value = v),
                onRangeSelect: (r: Range) => selected.push(r)
            })
        )
    );
    const day = (n: number, month = 9) => document.querySelector<HTMLElement>(`[data-date="2026-${month}-${n}"]`)!;
    const button = () => document.querySelector<HTMLButtonElement>('.vt-daterange-dropdown')!;
    const grids = () => document.querySelectorAll('[role="grid"]');
    const titles = () => [...document.querySelectorAll<HTMLElement>('.vt-daterange-title')];
    /** The month or the year button in the title of the `index`th calendar. */
    const titleButton = (index: number, which: 'month' | 'year') => titles()[index]!.querySelector<HTMLButtonElement>(`.vt-daterange-${which}-button`)!;
    const cell = (name: 'month' | 'year', n: number) => document.querySelector<HTMLElement>(`[role="gridcell"][data-${name}="${n}"]`)!;
    const settle = async () => {
        await nextTick();
        await nextTick();
    };
    return { value, selected, wrapper, day, button, grids, titles, titleButton, cell, settle };
}

describe('DateRange', () => {
    beforeEach(() => {
        // Tuesday 15 September 2026 is "today": the calendars open on September
        // and October whenever this runs. Only Date is faked, so timers still run.
        vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 15, 10, 30) });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('leaves out a neighbouring month while showing that month next door', async () => {
        // Two calendars, September and October 2026. September's grid runs on
        // into October and October's starts back in September, so without this
        // the same date is drawn twice, a range paints across both copies and
        // the line between the two calendars stops meaning anything.
        mountRange({ inline: true });
        await nextTick();
        const cells = [...document.querySelectorAll('.vt-daterange-day')];
        expect(cells.length).toBe(2 * 6 * 7);
        const blanks = cells.filter((c) => c.classList.contains('vt-daterange-day-blank'));
        expect(blanks.length).toBeGreaterThan(0);
        // The grid keeps its six rows: the cells are there, they are just empty.
        expect(blanks.every((c) => !c.hasAttribute('data-date') && c.textContent === '')).toBe(true);
        expect(document.querySelectorAll('.vt-daterange-day-other-month')).toHaveLength(0);
        // Every date on show now has exactly one cell, so exactly one tab stop.
        const dated = cells.filter((c) => c.hasAttribute('data-date')).map((c) => c.getAttribute('data-date'));
        expect(new Set(dated).size).toBe(dated.length);
        expect(document.querySelectorAll('.vt-daterange-day[tabindex="0"]')).toHaveLength(1);
    });

    it('draws the neighbouring days on a single calendar, and wherever it is asked to', async () => {
        document.body.innerHTML = '';
        mountRange({ inline: true, months: 1 });
        await nextTick();
        // One calendar has no neighbour to duplicate, so the days either side stay.
        expect(document.querySelectorAll('.vt-daterange-day-blank')).toHaveLength(0);
        expect(document.querySelectorAll('.vt-daterange-day-other-month').length).toBeGreaterThan(0);

        document.body.innerHTML = '';
        mountRange({ inline: true, showOtherMonths: true });
        await nextTick();
        expect(document.querySelectorAll('.vt-daterange-day-blank')).toHaveLength(0);
        expect(document.querySelectorAll('.vt-daterange-day-other-month').length).toBeGreaterThan(0);
    });

    it('opens a dialog holding two months, which is the point of it', async () => {
        const { button, grids } = mountRange();
        expect(grids()).toHaveLength(0);
        button().click();
        await nextTick();
        expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true');
        expect(grids()).toHaveLength(2);

        document.body.innerHTML = '';
        const one = mountRange({ months: 1 });
        one.button().click();
        await nextTick();
        expect(one.grids()).toHaveLength(1);
    });

    it('opens the range on the first press and closes it on the second, either way round', async () => {
        const { value, selected, button, day } = mountRange();
        button().click();
        await nextTick();

        day(10).click();
        await nextTick();
        expect(value.value).toEqual({ start: at(10), end: null });
        // Half a range is not a range: nothing is announced and the dialog stays.
        expect(selected).toHaveLength(0);
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();

        day(4).click();
        await nextTick();
        expect(value.value).toEqual({ start: at(4), end: at(10) });
        expect(selected).toHaveLength(1);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it('draws the span, and previews the other end before it is committed', async () => {
        const { button, day } = mountRange();
        button().click();
        await nextTick();
        day(10).click();
        await nextTick();

        day(13).dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
        await nextTick();
        // The days between are in the band, and the band says it is only a preview.
        expect(day(11).className).toContain('vt-daterange-day-in-range');
        expect(day(11).className).toContain('vt-daterange-day-preview');
        expect(day(13).className).toContain('vt-daterange-day-end');
        expect(day(14).className).not.toContain('vt-daterange-day-in-range');
    });

    it('moves across the months with the arrows and chooses with Enter', async () => {
        const { value, button, day } = mountRange();
        button().click();
        await nextTick();

        const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
        await press(grid, 'Enter');
        const start = value.value.start!;
        expect(start).toBeTruthy();

        await press(grid, 'ArrowRight');
        await press(grid, 'ArrowRight');
        await press(grid, 'Enter');
        expect(value.value.end).toBeTruthy();
        expect(Math.round((value.value.end!.getTime() - value.value.start!.getTime()) / 86400000)).toBe(2);
        void day;
    });

    it('refuses a day outside its limits', async () => {
        const { value, button, day } = mountRange({ minDate: at(8) });
        button().click();
        await nextTick();
        day(3).click();
        await nextTick();
        expect(value.value.start).toBeNull();
        expect(day(3).getAttribute('aria-disabled')).toBe('true');
    });

    it('goes to a year and a month from a title, and puts the month where the title was', async () => {
        const { value, button, grids, titles, titleButton, cell, day, settle } = mountRange();
        button().click();
        await nextTick();
        day(10).click();
        await nextTick();
        expect(titles().map((t) => t.textContent)).toEqual(['September 2026', 'October 2026']);

        // The year of the second calendar.
        titleButton(1, 'year').click();
        await settle();
        expect(grids()).toHaveLength(1);
        expect(titles().map((t) => t.textContent?.trim())).toEqual(['2020 – 2039']);
        expect(grids()[0]!.getAttribute('aria-label')).toBe('2020 – 2039');
        expect(document.querySelectorAll('[role="gridcell"]')).toHaveLength(20);
        // The year an end of the range is in is marked, and the grid starts from the calendar pressed.
        expect(cell('year', 2026).getAttribute('aria-selected')).toBe('true');
        expect(document.activeElement).toBe(cell('year', 2026));
        expect(document.querySelector('[aria-label="Previous years"]')).not.toBeNull();

        cell('year', 2028).click();
        await settle();
        expect(titles().map((t) => t.textContent?.trim())).toEqual(['2028']);
        expect(document.querySelectorAll('[role="gridcell"]')).toHaveLength(12);
        expect(document.activeElement).toBe(cell('month', 10));
        expect(cell('month', 3).getAttribute('aria-label')).toBe('March');
        document.querySelector<HTMLButtonElement>('[aria-label="Next year"]')!.click();
        await nextTick();
        expect(titles()[0]!.textContent?.trim()).toBe('2029');

        cell('month', 3).click();
        await settle();
        // March 2029 is the second calendar, as October was: the first is the month before.
        expect([...grids()].map((g) => g.getAttribute('aria-label'))).toEqual(['February 2029', 'March 2029']);
        expect((document.activeElement as HTMLElement).dataset.date).toBe('2029-3-1');
        // The range is where it was, and still open: one end down.
        expect(value.value).toEqual({ start: at(10), end: null });
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    });

    it('moves through the months with the keys, inside its limits, and Escape goes back to the days', async () => {
        const { button, grids, titles, titleButton, cell, settle } = mountRange({ minDate: at(1, 5), maxDate: at(20, 10) });
        button().click();
        await nextTick();
        // Vue drops an event that is no newer than the listener it reaches, and the
        // clock here stands still: a minute on, so a key can bubble to the panel.
        vi.setSystemTime(new Date(2026, 8, 15, 10, 31));
        titleButton(0, 'month').click();
        await settle();
        const focused = () => document.activeElement as HTMLElement;
        expect(focused().dataset.month).toBe('9');
        expect(cell('month', 5).getAttribute('aria-disabled')).toBe('true');
        expect(cell('month', 12).getAttribute('aria-disabled')).toBe('true');
        expect(document.querySelector<HTMLButtonElement>('[aria-label="Previous year"]')!.disabled).toBe(true);
        await press(focused(), 'ArrowRight');
        expect(focused().dataset.month).toBe('10');
        await press(focused(), 'ArrowDown');
        expect(focused().dataset.month).toBe('11');
        await press(focused(), 'PageUp');
        expect(focused().dataset.month).toBe('6');
        cell('month', 5).click();
        await nextTick();
        expect(titles()[0]!.textContent?.trim()).toBe('2026');

        await press(focused(), 'Escape');
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        expect([...grids()].map((g) => g.getAttribute('aria-label'))).toEqual(['September 2026', 'October 2026']);
        await press(focused(), 'Escape');
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it('leaves the month or the year as text when its grid is switched off', async () => {
        const years = mountRange({ inline: true, monthPicker: false, 'aria-label': 'Stay dates' });
        await nextTick();
        // Inline, the calendars are the component and carry the name it is given.
        expect(document.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Stay dates');
        expect(years.titles().map((t) => t.textContent)).toEqual(['September 2026', 'October 2026']);
        expect(document.querySelectorAll('.vt-daterange-month-button')).toHaveLength(0);
        expect(document.querySelectorAll('.vt-daterange-year-button')).toHaveLength(2);
        years.titleButton(0, 'year').click();
        await years.settle();
        years.cell('year', 2030).click();
        await years.settle();
        // With no month grid to go through, a year is the same month of that year.
        expect([...years.grids()].map((g) => g.getAttribute('aria-label'))).toEqual(['September 2030', 'October 2030']);

        document.body.innerHTML = '';
        const monthsOnly = mountRange({ inline: true, yearPicker: false });
        await nextTick();
        expect(document.querySelectorAll('.vt-daterange-year-button')).toHaveLength(0);
        monthsOnly.titleButton(1, 'month').click();
        await monthsOnly.settle();
        // The year above the months is text too: there is no grid of years to open.
        expect(monthsOnly.titles()[0]!.textContent?.trim()).toBe('2026');
        expect(monthsOnly.titles()[0]!.querySelector('button')).toBeNull();

        document.body.innerHTML = '';
        const neither = mountRange({ inline: true, monthPicker: false, yearPicker: false });
        await nextTick();
        expect(neither.titles().map((t) => t.textContent)).toEqual(['September 2026', 'October 2026']);
        expect(document.querySelectorAll('.vt-daterange-title button')).toHaveLength(0);
    });

    it('has no axe violations, closed or open, or on the month and year grids', async () => {
        const { button, titleButton, settle, titles } = mountRange({ showClearButton: true });
        await expectNoA11yViolations();
        button().click();
        await nextTick();
        await expectNoA11yViolations();
        titleButton(0, 'month').click();
        await settle();
        await expectNoA11yViolations();
        titles()[0]!.querySelector('button')!.click();
        await settle();
        await expectNoA11yViolations();
    });

    describe('typing a range', () => {
        const input = () => document.querySelector<HTMLInputElement>('.vt-daterange-input')!;
        const keys = async (text: string) => {
            for (const k of text) await press(input(), k);
        };

        it('types into the shape of two dates and reads them on Enter', async () => {
            const { value, selected } = mountRange();
            input().focus();
            await nextTick();
            expect(input().value).toBe('__/__/____ – __/__/____');
            await keys('0918202609222026');
            expect(input().value).toBe('09/18/2026 – 09/22/2026');
            await press(input(), 'Enter');
            expect(value.value).toEqual({ start: at(18), end: at(22) });
            expect(selected).toHaveLength(1);
        });

        it('takes a start alone, sorts ends typed backwards, and puts back what it cannot read', async () => {
            const { value } = mountRange();
            input().focus();
            await nextTick();
            await keys('09182026');
            input().dispatchEvent(new FocusEvent('blur'));
            await nextTick();
            expect(value.value).toEqual({ start: at(18), end: null });
            const paste = (text: string) => {
                const event = new Event('paste', { cancelable: true }) as ClipboardEvent;
                Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
                input().setSelectionRange(0, input().value.length);
                input().dispatchEvent(event);
            };
            paste('9/30/2026 - 9/20/2026');
            await press(input(), 'Enter');
            expect(value.value).toEqual({ start: at(20), end: at(30) });
            input().setSelectionRange(0, 2);
            await keys('13');
            await press(input(), 'Enter');
            expect(value.value).toEqual({ start: at(20), end: at(30) });
            expect(input().value).toBe('09/20/2026 – 09/30/2026');
        });

        it('types each end with its time', async () => {
            const { value } = mountRange({ showTime: true, hour12: false });
            input().focus();
            await nextTick();
            expect(input().value).toBe('__/__/____ __:__ – __/__/____ __:__');
            await keys('091820261400092220261130');
            await press(input(), 'Enter');
            expect(value.value).toEqual({ start: new Date(2026, 8, 18, 14, 0), end: new Date(2026, 8, 22, 11, 30) });
        });

        it('only shows the range, and opens on a press, without manualInput', async () => {
            const { settle } = mountRange({ manualInput: false });
            expect(input().readOnly).toBe(true);
            input().click();
            await settle();
            expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        });
    });

    describe('with times', () => {
        const typeTime = async (id: 'start' | 'end', text: string) => {
            const field = document.querySelector<HTMLInputElement>(`.vt-daterange-time:${id === 'start' ? 'first' : 'last'}-child input`)!;
            field.value = text;
            field.dispatchEvent(new Event('input'));
            await press(field, 'Enter');
            await nextTick();
            return field;
        };

        it('gives each end a time, keeps the calendars open, and writes both', async () => {
            const { value, selected, day, button, settle } = mountRange({ showTime: true, hour12: false });
            button().click();
            await settle();
            const fields = () => [...document.querySelectorAll<HTMLInputElement>('.vt-daterange-time input')];
            expect(fields().map((f) => f.labels?.[0]?.textContent)).toEqual(['Start time', 'End time']);
            expect(fields().every((f) => f.disabled)).toBe(true);
            day(18).click();
            await nextTick();
            day(22).click();
            await settle();
            expect(document.querySelector('[role="dialog"]')).not.toBeNull();
            expect(selected).toHaveLength(1);
            await typeTime('start', '14:00');
            await typeTime('end', '11:30');
            expect(value.value).toEqual({ start: new Date(2026, 8, 18, 14, 0), end: new Date(2026, 8, 22, 11, 30) });
            expect(selected).toHaveLength(3);
            expect(document.querySelector<HTMLInputElement>('.vt-daterange-input')!.value).toBe('09/18/2026 14:00 – 09/22/2026 11:30');
        });

        it('keeps each end its time when the days change', async () => {
            const { value, day, settle } = mountRange({ showTime: true, hour12: false, inline: true });
            value.value = { start: new Date(2026, 8, 18, 14, 0), end: new Date(2026, 8, 22, 11, 30) };
            await settle();
            day(10).click();
            await settle();
            expect(value.value).toEqual({ start: new Date(2026, 8, 10, 14, 0), end: null });
            day(12).click();
            await settle();
            expect(value.value).toEqual({ start: new Date(2026, 8, 10, 14, 0), end: new Date(2026, 8, 12, 11, 30) });
        });

        it('keeps both times inside minTime and maxTime', async () => {
            const { value, day, settle } = mountRange({ showTime: true, hour12: false, inline: true, minTime: '09:00', maxTime: '17:00' });
            await settle();
            day(10).click();
            await nextTick();
            day(12).click();
            await settle();
            expect(value.value).toEqual({ start: new Date(2026, 8, 10, 9, 0), end: new Date(2026, 8, 12, 9, 0) });
        });

        it('has no time fields without showTime, and closes on the second day', async () => {
            const { day, button, settle } = mountRange();
            button().click();
            await settle();
            expect(document.querySelector('.vt-daterange-times')).toBeNull();
            day(18).click();
            await nextTick();
            day(22).click();
            await settle();
            expect(document.querySelector('[role="dialog"]')).toBeNull();
        });
    });
});