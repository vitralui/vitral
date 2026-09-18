import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import RadioGroup from '../RadioGroup/RadioGroup.vue';
import RadioButton from './RadioButton.vue';

const sizes = ['S', 'M', 'L'];

function mountGroup(groupProps: Record<string, unknown> = {}, initial: unknown = 'M') {
    const value = ref<unknown>(initial);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('span', { id: 'size-label' }, 'Size'),
            h(
                RadioGroup,
                { 'aria-labelledby': 'size-label', ...groupProps, modelValue: value.value, 'onUpdate:modelValue': (v: unknown) => (value.value = v) },
                () => sizes.map((size) => h(RadioButton, { value: size, label: size }))
            )
        ])
    );
    const radios = () => Array.from(document.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    const group = () => document.querySelector<HTMLElement>('[role="radiogroup"]')!;
    return { wrapper, value, radios, group };
}

describe('RadioButton and RadioGroup', () => {
    it('is a radiogroup named by its label, of native radios named by theirs', () => {
        const { radios, group } = mountGroup();
        expect(group().getAttribute('aria-labelledby')).toBe('size-label');
        expect(radios().map((r) => r.labels?.[0]?.textContent?.trim())).toEqual(sizes);
    });

    it('gives its radios one name, which is what lets the arrow keys move between them', () => {
        const { radios } = mountGroup({ name: 'shirt-size' });
        expect(new Set(radios().map((r) => r.name))).toEqual(new Set(['shirt-size']));
        const generated = mountGroup().radios().slice(3);
        expect(generated[0]!.name).toBeTruthy();
        expect(generated.every((r) => r.name === generated[0]!.name)).toBe(true);
        expect(generated[0]!.name).not.toBe('shirt-size');
    });

    it('checks the radio whose value is the model', () => {
        const { radios, wrapper } = mountGroup();
        expect(radios().map((r) => r.checked)).toEqual([false, true, false]);
        expect(wrapper.findAll('.vt-radiobutton')[1]!.classes()).toContain('vt-radiobutton-checked');
    });

    it('updates the model and emits change when a radio is chosen', async () => {
        const { radios, value, wrapper } = mountGroup();
        radios()[2]!.click();
        await nextTick();
        expect(value.value).toBe('L');
        expect(radios().map((r) => r.checked)).toEqual([false, false, true]);
        expect(wrapper.findComponent(RadioGroup).emitted('change')?.[0]?.[0]).toMatchObject({ value: 'L' });
    });

    it('follows what the browser does on an arrow key: checks the next radio and fires change — without blocking the key', async () => {
        const { radios, value } = mountGroup();
        const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
        radios()[1]!.focus();
        radios()[1]!.dispatchEvent(arrow);
        expect(arrow.defaultPrevented).toBe(false);
        radios()[2]!.checked = true;
        radios()[2]!.dispatchEvent(new Event('change', { bubbles: true }));
        await nextTick();
        expect(value.value).toBe('L');
    });

    it('keeps one tab stop: only the checked radio of the group is where Tab lands', () => {
        const { radios } = mountGroup();
        // Browsers skip unchecked radios of a named group when one is checked; that needs the shared name and exactly one checked.
        expect(radios().filter((r) => r.checked)).toHaveLength(1);
        expect(radios().every((r) => r.tabIndex === 0 && !r.hasAttribute('tabindex'))).toBe(true);
    });

    it('compares object values structurally', async () => {
        const value = ref<unknown>({ id: 2 });
        mountVt(
            defineComponent(() => () =>
                h(RadioGroup, { 'aria-label': 'Plan', modelValue: value.value, 'onUpdate:modelValue': (v: unknown) => (value.value = v) }, () =>
                    [1, 2].map((id) => h(RadioButton, { value: { id }, label: `Plan ${id}` }))
                )
            )
        );
        const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
        expect(radios.map((r) => r.checked)).toEqual([false, true]);
        radios[0]!.click();
        await nextTick();
        expect(value.value).toEqual({ id: 1 });
    });

    it('disables, invalidates and sizes every radio from the group', () => {
        const { radios, group, wrapper } = mountGroup({ disabled: true, invalid: true, size: 'small' });
        expect(radios().every((r) => r.disabled)).toBe(true);
        expect(group().getAttribute('aria-invalid')).toBe('true');
        expect(wrapper.findAll('.vt-radiobutton').every((w) => w.classes().includes('vt-radiobutton-invalid') && w.classes().includes('vt-radiobutton-sm'))).toBe(true);
    });

    it('lays out horizontally on request', () => {
        const { group } = mountGroup({ orientation: 'horizontal' });
        expect(group().classList).toContain('vt-radiogroup-horizontal');
        expect(group().getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('works on its own with v-model and a name', async () => {
        const value = ref<unknown>('a');
        mountVt(
            defineComponent(() => () =>
                ['a', 'b'].map((v) => h(RadioButton, { value: v, name: 'solo', label: v.toUpperCase(), modelValue: value.value, 'onUpdate:modelValue': (next: unknown) => (value.value = next) }))
            )
        );
        const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
        expect(radios.map((r) => [r.name, r.value, r.checked])).toEqual([
            ['solo', 'a', true],
            ['solo', 'b', false]
        ]);
        radios[1]!.click();
        await nextTick();
        expect(value.value).toBe('b');
    });

    it('sends class and style to the wrapper and every other attribute to the input', () => {
        const wrapper = mountVt(RadioButton, { props: { value: 1 }, attrs: { id: 'r1', class: 'spaced', 'aria-describedby': 'hint' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-radiobutton', 'spaced']));
        expect(wrapper.get('input').attributes()).toMatchObject({ id: 'r1', 'aria-describedby': 'hint' });
    });

    it('has no accessibility violations, vertical, horizontal, disabled and invalid', async () => {
        mountGroup();
        mountGroup({ orientation: 'horizontal', name: 'b' });
        mountGroup({ disabled: true, invalid: true, name: 'c' }, null);
        await expectNoA11yViolations();
    });
});
