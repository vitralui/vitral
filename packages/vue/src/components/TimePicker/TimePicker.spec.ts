import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import TimePicker from './TimePicker.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function mountPicker(props: Record<string, unknown> = {}) {
    const value = ref<number | null>((props.modelValue as number) ?? null);
    const picked: number[] = [];
    mountVt(
        defineComponent(() => () =>
            h(TimePicker, {
                'aria-label': 'Start',
                hour12: false,
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: number | null | undefined) => (value.value = v ?? null),
                onTimeSelect: (m: number) => picked.push(m)
            })
        )
    );
    const input = () => document.querySelector<HTMLInputElement>('.vt-timepicker-input')!;
    const button = () => document.querySelector<HTMLButtonElement>('.vt-timepicker-dropdown')!;
    const options = () => [...document.querySelectorAll<HTMLElement>('.vt-timepicker-option')];
    return { value, picked, input, button, options };
}

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

describe('TimePicker', () => {
    it('is a combobox over a list of times', async () => {
        const { input, button, options } = mountPicker({ step: 60 });
        expect(input().getAttribute('role')).toBe('combobox');
        expect(input().getAttribute('aria-expanded')).toBe('false');
        expect(options()).toHaveLength(0);

        button().click();
        await nextTick();
        expect(input().getAttribute('aria-expanded')).toBe('true');
        // A day of hours.
        expect(options()).toHaveLength(24);
        expect(options()[9]!.textContent?.trim()).toBe('09:00');
        expect(document.querySelector('[role="listbox"]')).not.toBeNull();
        await expectNoA11yViolations();
    });

    it('takes a time from the list, and says which one it took', async () => {
        const { value, picked, button, options, input } = mountPicker({ step: 60 });
        button().click();
        await nextTick();
        options()[9]!.click();
        await nextTick();
        expect(value.value).toBe(540);
        expect(picked).toEqual([540]);
        expect(input().value).toBe('09:00');
        // Taking one shuts the list.
        expect(document.querySelectorAll('.vt-timepicker-option')).toHaveLength(0);
    });

    it('takes what was typed, forgivingly, when the box is left', async () => {
        const { value, input } = mountPicker();
        input().value = '930';
        input().dispatchEvent(new Event('input', { bubbles: true }));
        input().dispatchEvent(new FocusEvent('blur'));
        await nextTick();
        expect(value.value).toBe(570);
        expect(input().value).toBe('09:30');

        // Something that names no time empties it rather than guessing.
        input().value = 'later';
        input().dispatchEvent(new Event('input', { bubbles: true }));
        input().dispatchEvent(new FocusEvent('blur'));
        await nextTick();
        expect(value.value).toBeNull();
    });

    it('walks the list with the arrows and takes one with Enter', async () => {
        const { value, input, options } = mountPicker({ step: 60 });
        key(input(), 'ArrowDown');
        await nextTick();
        expect(options().length).toBe(24);
        key(input(), 'ArrowDown');
        await nextTick();
        key(input(), 'Enter');
        await nextTick();
        // Opened on the first row, then one down.
        expect(value.value).toBe(60);
    });

    it('offers only the times it is allowed to, and clamps what is typed', async () => {
        const { value, input, button, options } = mountPicker({ step: 60, minTime: '09:00', maxTime: '17:00' });
        button().click();
        await nextTick();
        expect(options().map((o) => o.textContent?.trim())).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);

        // Shut first: leaving the box while the list is open means focus went
        // into the list, and what was typed is not committed out from under it.
        key(input(), 'Escape');
        await nextTick();
        input().value = '06:00';
        input().dispatchEvent(new Event('input', { bubbles: true }));
        input().dispatchEvent(new FocusEvent('blur'));
        await nextTick();
        expect(value.value).toBe(540);
    });

    it('writes the time the way it was asked to', async () => {
        const twelve = mountPicker({ modelValue: 1290, hour12: true });
        await settle();
        expect(twelve.input().value).toMatch(/9:30\s?PM/i);

        document.body.innerHTML = '';
        const twentyFour = mountPicker({ modelValue: 1290, hour12: false });
        await settle();
        expect(twentyFour.input().value).toBe('21:30');
    });
});
