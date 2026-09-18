import { describe, expect, it } from 'vitest';
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
    return { value, selected, wrapper, day, button, grids };
}

describe('DateRange', () => {
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

    it('has no axe violations, closed or open', async () => {
        const { button } = mountRange({ showClearButton: true });
        await expectNoA11yViolations();
        button().click();
        await nextTick();
        await expectNoA11yViolations();
    });
});
