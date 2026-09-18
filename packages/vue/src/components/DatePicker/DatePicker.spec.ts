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
        const prev = document.querySelector<HTMLElement>('[aria-label="Previous month"]')!;
        const clear = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button')).find((b) => b.textContent?.trim() === 'Clear')!;
        clear.focus();
        await press(clear, 'Tab');
        expect(document.activeElement).toBe(prev);
        await press(prev, 'Tab', { shiftKey: true });
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
        document.body.innerHTML = '';
        mountVt(defineComponent(() => () => [h('span', { id: 'inline-label' }, 'Delivery'), h(DatePicker, { inline: true, 'aria-labelledby': 'inline-label', modelValue: d(2026, 3, 5) })]));
        await expectNoA11yViolations();
    });
});
