import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, type VNode } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Slider from './Slider.vue';
import type { SliderValue } from './types';

function mountSlider(props: Record<string, unknown> = {}, before: () => VNode | null = () => null) {
    const value = ref<SliderValue | null | undefined>(props.modelValue as SliderValue | undefined);
    const wrapper = mountVt(
        defineComponent(() => () => [
            before(),
            h(Slider, { ...props, modelValue: value.value, 'onUpdate:modelValue': (v: SliderValue | null | undefined) => (value.value = v) } as Record<string, unknown>)
        ])
    );
    const thumbs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="slider"]'));
    const slider = () => wrapper.findComponent(Slider);
    return { wrapper, value, thumbs, slider };
}

/** Gives the track a 200px box at the origin, since jsdom lays nothing out. */
function stubTrack(size = 200) {
    const track = document.querySelector<HTMLElement>('.vt-slider-track')!;
    track.getBoundingClientRect = () => ({ left: 0, top: 0, right: size, bottom: size, width: size, height: size, x: 0, y: 0, toJSON: () => ({}) });
    return track;
}

async function pointer(el: Element, type: string, init: { clientX?: number; clientY?: number } = {}) {
    const Ctor = (window.PointerEvent ?? MouseEvent) as typeof MouseEvent;
    el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init }));
    await nextTick();
}

const nameOf = (el: Element) =>
    el.getAttribute('aria-label') ??
    (el.getAttribute('aria-labelledby') ?? '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .join(' ');

describe('Slider', () => {
    it('is a named, horizontal slider exposing its value and bounds', () => {
        const { thumbs } = mountSlider({ modelValue: 30, min: 10, max: 60, ariaLabel: 'Volume', formatValue: (v: number) => `${v}%` });
        const [thumb] = thumbs();
        expect(thumbs()).toHaveLength(1);
        expect(thumb!.getAttribute('tabindex')).toBe('0');
        expect(thumb!.getAttribute('aria-label')).toBe('Volume');
        expect(thumb!.getAttribute('aria-valuenow')).toBe('30');
        expect(thumb!.getAttribute('aria-valuemin')).toBe('10');
        expect(thumb!.getAttribute('aria-valuemax')).toBe('60');
        expect(thumb!.getAttribute('aria-valuetext')).toBe('30%');
        expect(thumb!.getAttribute('aria-orientation')).toBe('horizontal');
        expect(thumb!.style.insetInlineStart).toBe('40%');
    });

    it('sends class to the root and other attributes to the thumb', () => {
        const { wrapper, thumbs } = mountSlider({ class: 'wide', id: 'vol', 'aria-describedby': 'hint', ariaLabel: 'Volume' });
        expect(wrapper.find('.vt-slider').classes()).toEqual(expect.arrayContaining(['vt-slider', 'wide']));
        expect(thumbs()[0]!.id).toBe('vol');
        expect(thumbs()[0]!.getAttribute('aria-describedby')).toBe('hint');
    });

    it('steps with the arrows, pages by ten steps and jumps to the ends', async () => {
        const { thumbs, value, slider } = mountSlider({ modelValue: 50, step: 5, ariaLabel: 'Level' });
        const thumb = () => thumbs()[0]!;
        await press(thumb(), 'ArrowRight');
        expect(value.value).toBe(55);
        await press(thumb(), 'ArrowUp');
        expect(value.value).toBe(60);
        await press(thumb(), 'ArrowLeft');
        await press(thumb(), 'ArrowDown');
        expect(value.value).toBe(50);
        await press(thumb(), 'PageUp');
        expect(value.value).toBe(100);
        await press(thumb(), 'PageDown');
        expect(value.value).toBe(50);
        await press(thumb(), 'Home');
        expect(value.value).toBe(0);
        expect(thumb().getAttribute('aria-valuenow')).toBe('0');
        await press(thumb(), 'End');
        expect(value.value).toBe(100);
        await press(thumb(), 'ArrowRight');
        expect(value.value).toBe(100);
        expect(slider().emitted('change')).toHaveLength(8);
    });

    it('snaps to decimal steps without floating-point noise', async () => {
        const { thumbs, value } = mountSlider({ modelValue: 0.2, min: 0, max: 1, step: 0.1, ariaLabel: 'Opacity' });
        await press(thumbs()[0]!, 'ArrowRight');
        expect(value.value).toBe(0.3);
    });

    it('gives each thumb of a range a distinct name and bounds it by the other', async () => {
        const { thumbs, value } = mountSlider({ range: true, modelValue: [20, 60], ariaLabel: 'Price' });
        const [start, end] = thumbs();
        expect(nameOf(start!)).toBe('Price Minimum');
        expect(nameOf(end!)).toBe('Price Maximum');
        expect(start!.getAttribute('aria-valuemax')).toBe('60');
        expect(end!.getAttribute('aria-valuemin')).toBe('20');
        await press(start!, 'End');
        expect(value.value).toEqual([60, 60]);
        await press(start!, 'ArrowRight');
        expect(value.value).toEqual([60, 60]);
        await press(end!, 'Home');
        expect(value.value).toEqual([60, 60]);
        await press(end!, 'PageUp');
        expect(value.value).toEqual([60, 70]);
        await press(start!, 'Home');
        expect(value.value).toEqual([0, 70]);
    });

    it('takes a name per thumb from arrays, and labels without any from the locale', () => {
        mountSlider({ range: true, modelValue: [1, 2], ariaLabel: ['From', 'To'] });
        const named = Array.from(document.querySelectorAll('[role="slider"]'));
        expect(named.map((t) => t.getAttribute('aria-label'))).toEqual(['From', 'To']);
        document.body.innerHTML = '';
        const { thumbs } = mountSlider({ range: true });
        expect(thumbs().map(nameOf)).toEqual(['Minimum', 'Maximum']);
        expect(thumbs().map((t) => t.getAttribute('aria-valuenow'))).toEqual(['0', '100']);
    });

    it('jumps to a press on the track, then follows the drag and commits once', async () => {
        const { wrapper, thumbs, value, slider } = mountSlider({ modelValue: 0, ariaLabel: 'Volume' });
        const track = stubTrack();
        const root = wrapper.find('.vt-slider').element;
        await pointer(track, 'pointerdown', { clientX: 50 });
        expect(value.value).toBe(25);
        expect(document.activeElement).toBe(thumbs()[0]);
        expect(thumbs()[0]!.classList).toContain('vt-slider-thumb-active');
        await pointer(root, 'pointermove', { clientX: 151 });
        expect(value.value).toBe(76);
        await pointer(root, 'pointermove', { clientX: 400 });
        expect(value.value).toBe(100);
        expect(slider().emitted('change')).toBeUndefined();
        await pointer(root, 'pointerup', { clientX: 400 });
        expect(slider().emitted('change')).toEqual([[100]]);
        expect(slider().emitted('slideend')).toHaveLength(1);
        expect(thumbs()[0]!.classList).not.toContain('vt-slider-thumb-active');
        await pointer(root, 'pointermove', { clientX: 20 });
        expect(value.value).toBe(100);
    });

    it('follows the finger off the slider, and lets go where it is lifted', async () => {
        const { value, slider } = mountSlider({ modelValue: 0, ariaLabel: 'Volume' });
        const track = stubTrack();
        await pointer(track, 'pointerdown', { clientX: 50 });
        // Away from the control entirely: a capture on the root would have been
        // dropped by now, and the drag would have stopped following.
        await pointer(document.body, 'pointermove', { clientX: 160 });
        expect(value.value).toBe(80);
        await pointer(document.body, 'pointerup', { clientX: 160 });
        expect(slider().emitted('change')).toEqual([[80]]);
        // And nothing follows once it is lifted.
        await pointer(document.body, 'pointermove', { clientX: 20 });
        expect(value.value).toBe(80);
    });

    it('does not jump when a thumb is grabbed off-centre', async () => {
        const { wrapper, thumbs, value } = mountSlider({ modelValue: 50, ariaLabel: 'Volume' });
        stubTrack();
        await pointer(thumbs()[0]!, 'pointerdown', { clientX: 104 });
        expect(value.value).toBe(50);
        await pointer(wrapper.find('.vt-slider').element, 'pointermove', { clientX: 124 });
        expect(value.value).toBe(60);
    });

    it('moves the nearer range thumb, which stops at the other', async () => {
        const { wrapper, thumbs, value } = mountSlider({ range: true, modelValue: [20, 80] });
        const track = stubTrack();
        await pointer(track, 'pointerdown', { clientX: 180 });
        expect(value.value).toEqual([20, 90]);
        expect(document.activeElement).toBe(thumbs()[1]);
        await pointer(wrapper.find('.vt-slider').element, 'pointermove', { clientX: 10 });
        expect(value.value).toEqual([20, 20]);
    });

    it('runs a vertical slider from the bottom up', async () => {
        const { thumbs, value } = mountSlider({ orientation: 'vertical', modelValue: 0, ariaLabel: 'Gain' });
        expect(thumbs()[0]!.getAttribute('aria-orientation')).toBe('vertical');
        await pointer(stubTrack(), 'pointerdown', { clientY: 50 });
        expect(value.value).toBe(75);
        expect(thumbs()[0]!.style.bottom).toBe('75%');
    });

    it('ignores keys and presses while disabled, and leaves the tab order', async () => {
        const { thumbs, value } = mountSlider({ modelValue: 40, disabled: true, ariaLabel: 'Volume' });
        const thumb = thumbs()[0]!;
        expect(thumb.getAttribute('tabindex')).toBeNull();
        expect(thumb.getAttribute('aria-disabled')).toBe('true');
        await press(thumb, 'ArrowRight');
        await pointer(stubTrack(), 'pointerdown', { clientX: 150 });
        expect(value.value).toBe(40);
    });

    it('has no accessibility violations: single, range, vertical, disabled', async () => {
        mountSlider({ modelValue: 30, ariaLabel: 'Volume', formatValue: (v: number) => `${v}%` });
        mountSlider({ range: true, modelValue: [10, 90], ariaLabelledby: 'price-label' }, () => h('span', { id: 'price-label' }, 'Price'));
        mountSlider({ range: true, modelValue: [10, 90] });
        mountSlider({ orientation: 'vertical', modelValue: 50, ariaLabel: 'Gain' });
        mountSlider({ disabled: true, modelValue: 50, ariaLabel: 'Locked' });
        await expectNoA11yViolations();
        const labelled = Array.from(document.querySelectorAll('[role="slider"]'))[1]!;
        expect(nameOf(labelled)).toBe('Price Minimum');
    });
});
