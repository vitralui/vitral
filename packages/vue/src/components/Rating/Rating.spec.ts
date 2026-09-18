import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Rating from './Rating.vue';

function mountRating(props: Record<string, unknown> = {}) {
    const value = ref<number | null | undefined>(props.modelValue as number | undefined);
    mountVt(
        defineComponent(() => () =>
            h(Rating, { 'aria-label': 'Score', ...props, modelValue: value.value, 'onUpdate:modelValue': (v: number | null | undefined) => (value.value = v) })
        )
    );
    const group = () => document.querySelector<HTMLElement>('[role="radiogroup"]')!;
    const stars = () => Array.from(document.querySelectorAll<HTMLElement>('[role="radio"]'));
    return { value, group, stars };
}

describe('Rating', () => {
    it('is a named radio group of stars with one tab stop', () => {
        const { group, stars } = mountRating({ modelValue: 3 });
        expect(group().getAttribute('aria-label')).toBe('Score');
        expect(stars().map((s) => s.getAttribute('aria-label'))).toEqual(['1 star', '2 stars', '3 stars', '4 stars', '5 stars']);
        expect(stars().map((s) => s.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true', 'false', 'false']);
        expect(stars().map((s) => s.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
        expect(document.querySelectorAll('.vt-rating-option-active')).toHaveLength(3);
    });

    it('puts the first star in the tab order when nothing is chosen', () => {
        const { stars } = mountRating();
        expect(stars()[0]!.tabIndex).toBe(0);
        expect(stars().every((s) => s.getAttribute('aria-checked') === 'false')).toBe(true);
    });

    it('chooses with the arrows, wrapping, and jumps with Home and End', async () => {
        const { stars, value } = mountRating({ modelValue: 4 });
        stars()[3]!.focus();
        await press(stars()[3]!, 'ArrowRight');
        expect(value.value).toBe(5);
        expect(document.activeElement).toBe(stars()[4]);
        await press(stars()[4]!, 'ArrowRight');
        expect(value.value).toBe(1);
        await press(stars()[0]!, 'ArrowLeft');
        expect(value.value).toBe(5);
        await press(stars()[4]!, 'Home');
        expect(value.value).toBe(1);
        await press(stars()[0]!, 'End');
        expect(value.value).toBe(5);
        await press(stars()[4]!, 'ArrowDown');
        expect(value.value).toBe(4);
    });

    it('chooses on click and Space, and clears on a second press or Delete', async () => {
        const { stars, value } = mountRating();
        stars()[1]!.click();
        expect(value.value).toBe(2);
        await nextTick();
        stars()[1]!.click();
        expect(value.value).toBeNull();
        await press(stars()[2]!, ' ');
        expect(value.value).toBe(3);
        await press(stars()[2]!, 'Delete');
        expect(value.value).toBeNull();
    });

    it('does not change when read-only or cleared when not clearable', async () => {
        const readonly = mountRating({ modelValue: 2, readonly: true });
        expect(readonly.group().getAttribute('aria-readonly')).toBe('true');
        readonly.stars()[4]!.click();
        await press(readonly.stars()[1]!, 'ArrowRight');
        expect(readonly.value.value).toBe(2);
        expect(document.activeElement).toBe(readonly.stars()[2]);
    });

    it('keeps its value when a non-clearable star is pressed again', async () => {
        const { stars, value } = mountRating({ modelValue: 2, clearable: false });
        stars()[1]!.click();
        await nextTick();
        expect(value.value).toBe(2);
    });

    it('has no accessibility violations', async () => {
        mountRating({ modelValue: 3 });
        await expectNoA11yViolations();
    });

    it('takes half stars as a slider, and fills the star it is halfway through', async () => {
        const value = ref<number | null>(2.5);
        mountVt(defineComponent(() => () => h(Rating, { step: 0.5, ariaLabel: 'Score', modelValue: value.value, 'onUpdate:modelValue': (v: number | null | undefined) => (value.value = v ?? null) })));

        // Half a star is a position on a scale, not an option in a list.
        const slider = document.querySelector('[role="slider"]')!;
        expect(slider).toBeTruthy();
        expect(document.querySelectorAll('[role="radio"]')).toHaveLength(0);
        expect(slider.getAttribute('aria-valuenow')).toBe('2.5');
        expect(slider.getAttribute('aria-valuemax')).toBe('5');
        expect((slider as HTMLElement).tabIndex).toBe(0);

        // Two stars filled, the third half filled, the rest empty.
        const fills = Array.from(document.querySelectorAll<HTMLElement>('.vt-rating-fill')).map((el) => el.style.width);
        expect(fills).toEqual(['100%', '100%', '50%']);

        await press(slider, 'ArrowRight');
        expect(value.value).toBe(3);
        await press(slider, 'ArrowLeft');
        await press(slider, 'ArrowLeft');
        expect(value.value).toBe(2);
    });

    it('stays a radio group of whole stars by default', async () => {
        const value = ref<number | null>(3);
        mountVt(defineComponent(() => () => h(Rating, { ariaLabel: 'Score', modelValue: value.value, 'onUpdate:modelValue': (v: number | null | undefined) => (value.value = v ?? null) })));
        expect(document.querySelector('[role="radiogroup"]')).toBeTruthy();
        expect(document.querySelectorAll('[role="radio"]')).toHaveLength(5);
        expect(document.querySelector('[role="slider"]')).toBeNull();
        expect(Array.from(document.querySelectorAll<HTMLElement>('.vt-rating-fill')).map((el) => el.style.width)).toEqual(['100%', '100%', '100%']);
    });
});
