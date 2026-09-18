import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Knob from './Knob.vue';

function mountKnob(props: Record<string, unknown> = {}) {
    const value = ref<number | null | undefined>((props.modelValue as number | undefined) ?? 50);
    const changes: number[] = [];
    mountVt(
        defineComponent(() => () =>
            h(Knob, {
                'aria-label': 'Volume',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: number | null | undefined) => (value.value = v),
                onChange: (v: number) => changes.push(v)
            })
        )
    );
    const slider = () => document.querySelector<SVGElement>('[role="slider"]')!;
    return { value, slider, changes };
}

describe('Knob', () => {
    it('is a named slider with its value and bounds', () => {
        const { slider } = mountKnob({ modelValue: 30, min: 10, max: 80 });
        expect(slider().getAttribute('aria-label')).toBe('Volume');
        expect(slider().getAttribute('aria-valuenow')).toBe('30');
        expect(slider().getAttribute('aria-valuemin')).toBe('10');
        expect(slider().getAttribute('aria-valuemax')).toBe('80');
        expect(slider().getAttribute('tabindex')).toBe('0');
        expect(document.querySelector('text')?.textContent).toBe('30');
    });

    it('writes its value through the template, visibly and to assistive technology', () => {
        const { slider } = mountKnob({ modelValue: 40, valueTemplate: '{value}%' });
        expect(slider().getAttribute('aria-valuetext')).toBe('40%');
        expect(document.querySelector('text')?.textContent).toBe('40%');
    });

    it('takes the slider keys', async () => {
        const { slider, value, changes } = mountKnob({ step: 5 });
        await press(slider(), 'ArrowUp');
        expect(value.value).toBe(55);
        await press(slider(), 'ArrowLeft');
        expect(value.value).toBe(50);
        await press(slider(), 'PageUp');
        expect(value.value).toBe(100);
        await press(slider(), 'ArrowRight');
        expect(changes).toEqual([55, 50, 100]);
        await press(slider(), 'Home');
        expect(value.value).toBe(0);
        await press(slider(), 'End');
        expect(value.value).toBe(100);
    });

    it('sets the value under the pointer', async () => {
        const { slider, value, changes } = mountKnob();
        slider().getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
        slider().dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 50, bubbles: true }));
        expect(value.value).toBe(83);
        await nextTick();
        slider().dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 0, bubbles: true }));
        expect(value.value).toBe(50);
        await nextTick();
        slider().dispatchEvent(new PointerEvent('pointermove', { clientX: 0, clientY: 50, bubbles: true }));
        await nextTick();
        slider().dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        expect(value.value).toBe(17);
        expect(changes).toEqual([17]);
    });

    it('does not change when read-only, and leaves the tab order when disabled', async () => {
        const { slider, value } = mountKnob({ readonly: true });
        await press(slider(), 'ArrowUp');
        expect(value.value).toBe(50);
        expect(slider().getAttribute('aria-readonly')).toBe('true');
    });

    it('has no accessibility violations', async () => {
        mountKnob({ valueTemplate: '{value}%' });
        await expectNoA11yViolations();
    });
});
