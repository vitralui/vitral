import { ptBR } from '@vitral/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { VitralOptions } from '../../config/config';
import DatePicker from './DatePicker.vue';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const key = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

function mountPicker(props: Record<string, unknown> = {}, vitral: VitralOptions = { theme: 'none' }) {
    const value = ref<Date | null>((props.modelValue as Date | null | undefined) ?? null);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('label', { for: 'when' }, 'When'),
            h(DatePicker, { id: 'when', ...props, modelValue: value.value, 'onUpdate:modelValue': (v: Date | null | undefined) => (value.value = v ?? null) })
        ]),
        {},
        vitral
    );
    const input = () => document.getElementById('when') as HTMLInputElement;
    const button = () => document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    const grid = () => document.querySelector<HTMLElement>('[role="grid"]')!;
    const title = () => document.getElementById(grid().getAttribute('aria-labelledby')!)!;
    const cell = (date: Date) => grid().querySelector<HTMLElement>(`td[data-date="${key(date)}"]`)!;
    const focused = () => (document.activeElement as HTMLElement).dataset.date;
    const picker = () => wrapper.findComponent(DatePicker);
    const type = async (text: string, commit: 'blur' | 'Enter') => {
        input().value = text;
        input().dispatchEvent(new Event('input'));
        if (commit === 'blur') input().dispatchEvent(new FocusEvent('blur'));
        else await press(input(), 'Enter');
        await nextTick();
    };
    const openCalendar = async () => {
        button().click();
        await nextTick();
        await nextTick();
    };
    return { wrapper, value, input, button, dialog, grid, title, cell, focused, picker, type, openCalendar };
}

describe('DatePicker', () => {
    beforeEach(() => {
        // Wednesday 11 March 2026 is "today"; only Date is faked, so timers still run.
        vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 2, 11, 10, 30) });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('is a labelled text box and a named button that opens a modal dialog', async () => {
        const { input, button, dialog, openCalendar, focused } = mountPicker();
        expect(input().labels?.[0]?.textContent).toBe('When');
        expect(button().getAttribute('aria-label')).toBe('Choose date');
        expect(button().getAttribute('aria-expanded')).toBe('false');
        expect(dialog()).toBeNull();
        await openCalendar();
        expect(dialog()!.getAttribute('aria-modal')).toBe('true');
        expect(dialog()!.getAttribute('aria-label')).toBe('Choose date');
        expect(button().getAttribute('aria-expanded')).toBe('true');
        expect(button().getAttribute('aria-controls')).toBe(dialog()!.id);
        // With no value, focus lands on today.
        expect(focused()).toBe('2026-3-11');
    });

    it('shows its value and reads typed dates on blur and Enter, reverting anything else', async () => {
        const { input, value, type, picker } = mountPicker({ modelValue: d(2026, 3, 5), minDate: d(2026, 1, 1) });
        expect(input().value).toBe('03/05/2026');
        await type('04/20/2026', 'blur');
        expect(value.value).toEqual(d(2026, 4, 20));
        expect(picker().emitted('dateSelect')?.[0]).toEqual([d(2026, 4, 20)]);
        await type('13/45/2026', 'Enter');
        expect(input().value).toBe('04/20/2026');
        await type('12/31/2025', 'Enter');
        expect(input().value).toBe('04/20/2026');
        expect(value.value).toEqual(d(2026, 4, 20));
        await type('1/2/2026', 'Enter');
        expect(value.value).toEqual(d(2026, 1, 2));
        expect(input().value).toBe('01/02/2026');
        await type('', 'blur');
        expect(value.value).toBeNull();
        expect(picker().emitted('clear')).toHaveLength(1);
    });

    it('follows the locale for the format, the names and the first day of the week', async () => {
        const { input, openCalendar, title, grid } = mountPicker({ modelValue: d(2026, 3, 5), firstDayOfWeek: 1 }, { theme: 'none', locale: ptBR });
        expect(input().value).toBe('05/03/2026');
        await openCalendar();
        expect(title().textContent).toBe('março 2026');
        const first = grid().querySelector('th')!;
        expect(first.textContent).toBe('S');
        expect(first.getAttribute('abbr')).toBe('segunda-feira');
        expect(document.querySelector('button[aria-haspopup="dialog"]')!.getAttribute('aria-label')).toBe('Escolher data');
    });

    it('renders a grid of days with selection, today and a single tab stop', async () => {
        const { openCalendar, grid, title, cell } = mountPicker({ modelValue: d(2026, 3, 20) });
        await openCalendar();
        expect(title().textContent).toBe('March 2026');
        expect(title().getAttribute('aria-live')).toBe('polite');
        const headers = Array.from(grid().querySelectorAll('th'));
        expect(headers.map((th) => th.textContent)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
        expect(headers[0]!.getAttribute('abbr')).toBe('Sunday');
        expect(grid().querySelectorAll('td')).toHaveLength(42);
        expect(cell(d(2026, 3, 20)).getAttribute('aria-selected')).toBe('true');
        expect(cell(d(2026, 3, 19)).getAttribute('aria-selected')).toBe('false');
        expect(cell(d(2026, 3, 11)).getAttribute('aria-current')).toBe('date');
        expect(cell(d(2026, 3, 20)).getAttribute('aria-current')).toBeNull();
        expect(grid().querySelectorAll('td[tabindex="0"]')).toHaveLength(1);
        expect(cell(d(2026, 3, 20)).getAttribute('tabindex')).toBe('0');
        expect(document.activeElement).toBe(cell(d(2026, 3, 20)));
    });

    it('moves focus by day, week, month and year with the keys of the pattern', async () => {
        const { openCalendar, focused, title } = mountPicker({ modelValue: d(2026, 3, 11) });
        await openCalendar();
        const at = () => document.activeElement!;
        await press(at(), 'ArrowRight');
        expect(focused()).toBe('2026-3-12');
        await press(at(), 'ArrowDown');
        expect(focused()).toBe('2026-3-19');
        await press(at(), 'ArrowLeft');
        expect(focused()).toBe('2026-3-18');
        await press(at(), 'ArrowUp');
        expect(focused()).toBe('2026-3-11');
        await press(at(), 'Home');
        expect(focused()).toBe('2026-3-8');
        await press(at(), 'End');
        expect(focused()).toBe('2026-3-14');
        await press(at(), 'PageDown');
        expect(focused()).toBe('2026-4-14');
        expect(title().textContent).toBe('April 2026');
        await press(at(), 'PageUp');
        expect(focused()).toBe('2026-3-14');
        await press(at(), 'PageDown', { shiftKey: true });
        expect(focused()).toBe('2027-3-14');
        expect(title().textContent).toBe('March 2027');
        await press(at(), 'PageUp', { shiftKey: true });
        expect(focused()).toBe('2026-3-14');
        // Walking off the month shows the next one.
        await press(at(), 'ArrowDown');
        await press(at(), 'ArrowDown');
        await press(at(), 'ArrowDown');
        expect(focused()).toBe('2026-4-4');
        expect(title().textContent).toBe('April 2026');
    });

    it('selects with Enter or Space, closing and returning focus to the button', async () => {
        const { openCalendar, value, dialog, button, picker } = mountPicker({ modelValue: d(2026, 3, 11) });
        await openCalendar();
        await press(document.activeElement!, 'ArrowRight');
        await press(document.activeElement!, 'Enter');
        expect(value.value).toEqual(d(2026, 3, 12));
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(button());
        await openCalendar();
        await press(document.activeElement!, 'ArrowDown');
        await press(document.activeElement!, ' ');
        expect(value.value).toEqual(d(2026, 3, 19));
        expect(dialog()).toBeNull();
        expect(picker().emitted('hide')).toHaveLength(2);
    });

    it('selects a day with a click', async () => {
        const { openCalendar, value, cell, dialog, input } = mountPicker();
        await openCalendar();
        cell(d(2026, 4, 2)).click();
        await nextTick();
        expect(value.value).toEqual(d(2026, 4, 2));
        expect(input().value).toBe('04/02/2026');
        expect(dialog()).toBeNull();
    });

    it('closes on Escape, returning focus to the button, and on a press outside', async () => {
        const { openCalendar, value, dialog, button } = mountPicker({ modelValue: d(2026, 3, 11) });
        await openCalendar();
        await press(document.activeElement!, 'ArrowRight');
        await press(document.activeElement!, 'Escape');
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(button());
        expect(value.value).toEqual(d(2026, 3, 11));
        await openCalendar();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(dialog()).toBeNull();
    });

    it('keeps Tab inside the dialog', async () => {
        const { openCalendar } = mountPicker({ showClearButton: true });
        await openCalendar();
        // The month in the title is the first thing in the dialog.
        const month = document.querySelector<HTMLElement>('[role="dialog"] button')!;
        expect(month.textContent).toBe('March');
        const clear = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button')).find((b) => b.textContent?.trim() === 'Clear')!;
        clear.focus();
        await press(clear, 'Tab');
        expect(document.activeElement).toBe(month);
        await press(month, 'Tab', { shiftKey: true });
        expect(document.activeElement).toBe(clear);
    });

    it('skips and refuses days that cannot be chosen, and stays inside min and max', async () => {
        const { openCalendar, cell, focused, value, dialog } = mountPicker({ modelValue: d(2026, 3, 13), minDate: d(2026, 3, 5), maxDate: d(2026, 3, 25), disabledDays: [0, 6] });
        await openCalendar();
        expect(cell(d(2026, 3, 14)).getAttribute('aria-disabled')).toBe('true');
        expect(cell(d(2026, 3, 4)).getAttribute('aria-disabled')).toBe('true');
        expect(cell(d(2026, 3, 26)).getAttribute('aria-disabled')).toBe('true');
        expect(cell(d(2026, 3, 13)).getAttribute('aria-disabled')).toBeNull();
        expect(document.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')!.disabled).toBe(true);
        expect(document.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!.disabled).toBe(true);
        await press(document.activeElement!, 'ArrowRight');
        expect(focused()).toBe('2026-3-16');
        await press(document.activeElement!, 'End');
        expect(focused()).toBe('2026-3-20');
        await press(document.activeElement!, 'PageDown');
        expect(focused()).toBe('2026-3-25');
        await press(document.activeElement!, 'Home');
        expect(focused()).toBe('2026-3-23');
        cell(d(2026, 3, 14)).click();
        await nextTick();
        expect(value.value).toEqual(d(2026, 3, 13));
        expect(dialog()).not.toBeNull();
    });

    it('pages months with its named buttons', async () => {
        const { openCalendar, title, grid, picker } = mountPicker();
        await openCalendar();
        const next = document.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!;
        const prev = document.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')!;
        next.click();
        await nextTick();
        expect(title().textContent).toBe('April 2026');
        expect(grid().querySelector('td[tabindex="0"]')!.getAttribute('data-date')).toBe('2026-4-11');
        expect(picker().emitted('monthChange')?.[0]).toEqual([{ month: 3, year: 2026 }]);
        prev.click();
        prev.click();
        await nextTick();
        expect(title().textContent).toBe('February 2026');
    });

    it('goes to a year and then a month from the title, without paging there', async () => {
        const { openCalendar, title, grid, value, dialog, cell, picker, focused } = mountPicker({ modelValue: d(2026, 3, 11) });
        await openCalendar();
        const titleButton = (text: string) => Array.from(title().querySelectorAll('button')).find((b) => b.textContent === text)!;
        const page = (label: string) => document.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
        const at = (name: 'month' | 'year', n: number) => grid().querySelector<HTMLElement>(`[data-${name}="${n}"]`)!;
        // What each does is said in a tooltip, which describes it while it shows.
        titleButton('2026').dispatchEvent(new MouseEvent('mouseenter'));
        await new Promise((resolve) => setTimeout(resolve, 450));
        const tip = document.querySelector('[role="tooltip"]')!;
        expect(tip.textContent).toBe('Choose year');
        expect(titleButton('2026').getAttribute('aria-describedby')).toBe(tip.id);

        titleButton('2026').click();
        await nextTick();
        await nextTick();
        expect(title().textContent).toBe('2020 – 2039');
        expect(grid().querySelectorAll('[role="row"]')).toHaveLength(5);
        expect(grid().querySelectorAll('[role="gridcell"]')).toHaveLength(20);
        expect(at('year', 2026).getAttribute('aria-selected')).toBe('true');
        expect(at('year', 2026).getAttribute('aria-current')).toBe('date');
        expect(at('year', 2025).getAttribute('aria-selected')).toBe('false');
        expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
        expect(document.activeElement).toBe(at('year', 2026));

        page('Previous years').click();
        await nextTick();
        expect(title().textContent).toBe('2000 – 2019');
        at('year', 2005).click();
        await nextTick();
        await nextTick();
        // A year is not a date yet: its months come next.
        expect(title().textContent).toBe('2005');
        expect(grid().querySelectorAll('[role="gridcell"]')).toHaveLength(12);
        expect(at('month', 5).textContent).toBe('May');
        expect(at('month', 1).getAttribute('aria-label')).toBe('January');
        expect(document.activeElement).toBe(at('month', 3));
        page('Next year').click();
        await nextTick();
        expect(title().textContent).toBe('2006');
        page('Previous year').click();
        await nextTick();

        at('month', 5).click();
        await nextTick();
        await nextTick();
        expect(title().textContent).toBe('May 2005');
        expect(focused()).toBe('2005-5-11');
        expect(picker().emitted('monthChange')).toEqual([[{ month: 4, year: 2005 }]]);
        // Nothing is chosen until a day is.
        expect(value.value).toEqual(d(2026, 3, 11));
        expect(dialog()).not.toBeNull();
        cell(d(2005, 5, 20)).click();
        await nextTick();
        expect(value.value).toEqual(d(2005, 5, 20));
        expect(dialog()).toBeNull();
    });

    it('moves through months and years with the keys, and Escape goes back to the days', async () => {
        const { openCalendar, title, dialog, focused } = mountPicker({ modelValue: d(2026, 3, 31) });
        await openCalendar();
        // Vue drops an event that is no newer than the listener it reaches, and the
        // clock here stands still: a minute on, so a key can bubble to the panel.
        vi.setSystemTime(new Date(2026, 2, 11, 10, 31));
        const at = () => document.activeElement as HTMLElement;
        title().querySelector('button')!.click();
        await nextTick();
        await nextTick();
        expect(title().textContent).toBe('2026');
        expect(at().dataset.month).toBe('3');
        await press(at(), 'ArrowLeft');
        expect(at().dataset.month).toBe('2');
        await press(at(), 'ArrowDown');
        expect(at().dataset.month).toBe('5');
        await press(at(), 'Home');
        expect(at().dataset.month).toBe('4');
        await press(at(), 'End');
        expect(at().dataset.month).toBe('6');
        await press(at(), 'PageDown');
        expect(title().textContent).toBe('2027');
        expect(at().dataset.month).toBe('6');
        // Off the top of the year is the year before.
        await press(at(), 'ArrowUp');
        await press(at(), 'ArrowUp');
        expect(title().textContent).toBe('2026');
        expect(at().dataset.month).toBe('12');

        // The year, from the month grid's title.
        title().querySelector('button')!.click();
        await nextTick();
        await nextTick();
        expect(at().dataset.year).toBe('2026');
        await press(at(), 'ArrowUp');
        expect(at().dataset.year).toBe('2022');
        await press(at(), 'PageUp');
        expect(title().textContent).toBe('2000 – 2019');
        expect(at().dataset.year).toBe('2002');
        await press(at(), 'ArrowRight');
        await press(at(), 'Enter');
        expect(title().textContent).toBe('2003');
        expect(at().dataset.month).toBe('12');
        await press(at(), 'ArrowLeft');
        await press(at(), ' ');
        // The 31st is not a day of November: the focus takes its last one.
        expect(title().textContent).toBe('November 2003');
        expect(focused()).toBe('2003-11-30');

        title().querySelector('button')!.click();
        await nextTick();
        await nextTick();
        await press(at(), 'PageUp');
        expect(title().textContent).toBe('2002');
        await press(at(), 'Escape');
        expect(dialog()).not.toBeNull();
        expect(title().textContent).toBe('November 2003');
        expect(focused()).toBe('2003-11-30');
        await press(at(), 'Escape');
        expect(dialog()).toBeNull();
    });

    it('keeps the months and the years inside min and max', async () => {
        const { openCalendar, title, grid, focused } = mountPicker({ modelValue: d(2026, 3, 11), minDate: d(2025, 11, 10), maxDate: d(2026, 4, 20) });
        await openCalendar();
        const page = (label: string) => document.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
        const at = (name: 'month' | 'year', n: number) => grid().querySelector<HTMLElement>(`[data-${name}="${n}"]`)!;
        title().querySelector('button')!.click();
        await nextTick();
        await nextTick();
        expect(at('month', 4).getAttribute('aria-disabled')).toBeNull();
        expect(at('month', 5).getAttribute('aria-disabled')).toBe('true');
        expect(page('Previous year').disabled).toBe(false);
        expect(page('Next year').disabled).toBe(true);
        at('month', 5).click();
        await nextTick();
        expect(title().textContent).toBe('2026');
        await press(document.activeElement!, 'ArrowDown');
        expect((document.activeElement as HTMLElement).dataset.month).toBe('4');
        await press(document.activeElement!, 'PageUp');
        expect(title().textContent).toBe('2025');
        expect((document.activeElement as HTMLElement).dataset.month).toBe('11');

        title().querySelector('button')!.click();
        await nextTick();
        await nextTick();
        expect(at('year', 2024).getAttribute('aria-disabled')).toBe('true');
        expect(at('year', 2027).getAttribute('aria-disabled')).toBe('true');
        expect(page('Previous years').disabled).toBe(true);
        expect(page('Next years').disabled).toBe(true);
        at('year', 2027).click();
        await nextTick();
        expect(title().textContent).toBe('2020 – 2039');
        await press(document.activeElement!, 'Enter');
        await press(document.activeElement!, 'Enter');
        // November 2025 starts on the 10th here.
        expect(title().textContent).toBe('November 2025');
        expect(focused()).toBe('2025-11-11');
    });

    it('leaves the month or the year as text when its grid is switched off', async () => {
        const { openCalendar, title, grid, focused, dialog } = mountPicker({ modelValue: d(2026, 3, 11), monthPicker: false });
        await openCalendar();
        // The title reads the same; only the year can be pressed.
        expect(title().textContent).toBe('March 2026');
        expect(Array.from(title().querySelectorAll('button')).map((b) => b.textContent)).toEqual(['2026']);
        title().querySelector('button')!.click();
        await nextTick();
        await nextTick();
        expect(title().textContent).toBe('2020 – 2039');
        grid().querySelector<HTMLElement>('[data-year="2031"]')!.click();
        await nextTick();
        await nextTick();
        // With no month grid to go through, a year is the same month of that year.
        expect(title().textContent).toBe('March 2031');
        expect(focused()).toBe('2031-3-11');
        expect(dialog()).not.toBeNull();

        document.body.innerHTML = '';
        const months = mountPicker({ modelValue: d(2026, 3, 11), yearPicker: false });
        await months.openCalendar();
        expect(Array.from(months.title().querySelectorAll('button')).map((b) => b.textContent)).toEqual(['March']);
        months.title().querySelector('button')!.click();
        await nextTick();
        await nextTick();
        // The year above the months is text too: there is no grid of years to open.
        expect(months.title().textContent).toBe('2026');
        expect(months.title().querySelector('button')).toBeNull();
        expect(months.grid().querySelectorAll('[role="gridcell"]')).toHaveLength(12);

        document.body.innerHTML = '';
        const neither = mountPicker({ modelValue: d(2026, 3, 11), monthPicker: false, yearPicker: false });
        await neither.openCalendar();
        expect(neither.title().textContent).toBe('March 2026');
        expect(neither.title().querySelector('button')).toBeNull();
        await expectNoA11yViolations();
    });

    it('selects today and clears from the footer', async () => {
        const { openCalendar, value, dialog, button, picker } = mountPicker({ modelValue: d(2026, 3, 5), showTodayButton: true, showClearButton: true });
        await openCalendar();
        const footerButton = (label: string) => Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find((b) => b.textContent?.trim() === label)!;
        footerButton('Today').click();
        await nextTick();
        expect(value.value).toEqual(d(2026, 3, 11));
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(button());
        await openCalendar();
        footerButton('Clear').click();
        await nextTick();
        expect(value.value).toBeNull();
        expect(picker().emitted('clear')).toHaveLength(1);
    });

    it('opens with Alt+ArrowDown from the text box, and not while disabled or read-only', async () => {
        const readonly = ref(false);
        const disabled = ref(false);
        mountVt(defineComponent(() => () => h(DatePicker, { 'aria-label': 'When', readonly: readonly.value, disabled: disabled.value })));
        const input = () => document.querySelector('input')!;
        const button = () => document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
        const dialog = () => document.querySelector('[role="dialog"]');
        await press(input(), 'ArrowDown', { altKey: true });
        await nextTick();
        expect(dialog()).not.toBeNull();
        await press(document.activeElement!, 'Escape');
        readonly.value = true;
        await nextTick();
        expect(input().readOnly).toBe(true);
        expect(button().disabled).toBe(true);
        await press(input(), 'ArrowDown', { altKey: true });
        expect(dialog()).toBeNull();
        readonly.value = false;
        disabled.value = true;
        await nextTick();
        expect(input().disabled).toBe(true);
        expect(button().disabled).toBe(true);
    });

    it('sends class and style to the field and every other attribute to the text box', () => {
        const wrapper = mountVt(DatePicker, { props: { invalid: true, placeholder: 'Pick a date' }, attrs: { id: 'x', class: 'wide', 'aria-describedby': 'hint' } });
        expect(wrapper.get('.vt-datepicker').classes()).toEqual(expect.arrayContaining(['vt-field', 'vt-datepicker', 'vt-field-invalid', 'wide']));
        const input = wrapper.get('input');
        expect(input.attributes()).toMatchObject({ id: 'x', 'aria-describedby': 'hint', placeholder: 'Pick a date', 'aria-invalid': 'true' });
    });

    it('shows the calendar alone when inline, selecting in place', async () => {
        const value = ref<Date | null>(d(2026, 3, 11));
        mountVt(defineComponent(() => () => h(DatePicker, { inline: true, 'aria-label': 'Delivery day', modelValue: value.value, 'onUpdate:modelValue': (v: Date | null | undefined) => (value.value = v ?? null) })));
        expect(document.querySelector('input')).toBeNull();
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        const group = document.querySelector<HTMLElement>('[role="group"]')!;
        expect(group.getAttribute('aria-label')).toBe('Delivery day');
        const cell = (date: Date) => document.querySelector<HTMLElement>(`td[data-date="${key(date)}"]`)!;
        cell(d(2026, 3, 11)).focus();
        await press(cell(d(2026, 3, 11)), 'ArrowRight');
        await press(document.activeElement!, 'Enter');
        expect(value.value).toEqual(d(2026, 3, 12));
        expect(document.activeElement).toBe(cell(d(2026, 3, 12)));
        cell(d(2026, 3, 20)).click();
        await nextTick();
        expect(value.value).toEqual(d(2026, 3, 20));
        expect(document.querySelector('[role="group"]')).not.toBeNull();
    });

    it('has no accessibility violations: closed, open, and inline', async () => {
        const { openCalendar } = mountPicker({ modelValue: d(2026, 3, 5), showTodayButton: true, showClearButton: true, disabledDays: [0] });
        await expectNoA11yViolations();
        await openCalendar();
        await expectNoA11yViolations();
        // The month grid, then the year grid.
        for (let level = 0; level < 2; level++) {
            document.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click();
            await nextTick();
            await nextTick();
            await expectNoA11yViolations();
        }
        document.body.innerHTML = '';
        mountVt(defineComponent(() => () => [h('span', { id: 'inline-label' }, 'Delivery'), h(DatePicker, { inline: true, 'aria-labelledby': 'inline-label', modelValue: d(2026, 3, 5) })]));
        await expectNoA11yViolations();
    });
});
