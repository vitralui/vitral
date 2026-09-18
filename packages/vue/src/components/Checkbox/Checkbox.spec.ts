import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Checkbox from './Checkbox.vue';

function mountBox(props: Record<string, unknown> = {}, initial: unknown = false) {
    const value = ref<unknown>(initial);
    const wrapper = mountVt(
        defineComponent(() => () => h(Checkbox, { label: 'Subscribe', ...props, modelValue: value.value, 'onUpdate:modelValue': (v: unknown) => (value.value = v) }))
    );
    const input = () => wrapper.get('input').element as HTMLInputElement;
    return { wrapper, value, input };
}

describe('Checkbox', () => {
    it('is a native checkbox named by its own label', () => {
        const { input, wrapper } = mountBox();
        expect(input().type).toBe('checkbox');
        expect(input().labels?.[0]?.textContent?.trim()).toBe('Subscribe');
        expect(wrapper.get('label').attributes('for')).toBe(input().id);
    });

    it('toggles a boolean v-model, from the box and from its label', async () => {
        const { input, value, wrapper } = mountBox();
        input().click();
        await nextTick();
        expect(value.value).toBe(true);
        expect(input().checked).toBe(true);
        expect(wrapper.find('.vt-checkbox').classes()).toContain('vt-checkbox-checked');
        await wrapper.get('label').trigger('click');
        expect(value.value).toBe(false);
        expect(input().checked).toBe(false);
    });

    it('uses trueValue and falseValue for a binary model', async () => {
        const { input, value } = mountBox({ trueValue: 'yes', falseValue: 'no' }, 'no');
        expect(input().checked).toBe(false);
        input().click();
        await nextTick();
        expect(value.value).toBe('yes');
    });

    it('adds its value to an array model and removes it again', async () => {
        const chosen = ref<string[]>(['tea']);
        const wrapper = mountVt(
            defineComponent(() => () =>
                ['tea', 'coffee'].map((drink) =>
                    h(Checkbox, { value: drink, label: drink, modelValue: chosen.value, 'onUpdate:modelValue': (v: unknown) => (chosen.value = v as string[]) })
                )
            )
        );
        const [tea, coffee] = wrapper.findAll('input').map((w) => w.element as HTMLInputElement);
        expect(tea!.checked).toBe(true);
        expect(tea!.value).toBe('tea');
        coffee!.click();
        await nextTick();
        expect(chosen.value).toEqual(['tea', 'coffee']);
        tea!.click();
        await nextTick();
        expect(chosen.value).toEqual(['coffee']);
    });

    it('is announced as mixed while indeterminate, and the next toggle clears it', async () => {
        const mixed = ref(true);
        const value = ref(false);
        const wrapper = mountVt(
            defineComponent(() => () =>
                h(Checkbox, {
                    label: 'All',
                    modelValue: value.value,
                    indeterminate: mixed.value,
                    'onUpdate:modelValue': (v: unknown) => (value.value = v as boolean),
                    'onUpdate:indeterminate': (v: boolean) => (mixed.value = v)
                })
            )
        );
        const input = wrapper.get('input').element as HTMLInputElement;
        await nextTick();
        expect(input.indeterminate).toBe(true);
        expect(wrapper.find('.vt-checkbox').classes()).toContain('vt-checkbox-indeterminate');
        input.click();
        await nextTick();
        expect(mixed.value).toBe(false);
        expect(input.indeterminate).toBe(false);
        expect(value.value).toBe(true);
    });

    it('emits change with the new state', async () => {
        const { wrapper, input } = mountBox();
        input().click();
        await nextTick();
        expect(wrapper.findComponent(Checkbox).emitted('change')?.[0]?.[0]).toMatchObject({ checked: true, value: true });
    });

    it('does not toggle while disabled or read-only', async () => {
        const disabled = mountBox({ disabled: true });
        expect(disabled.input().disabled).toBe(true);
        disabled.input().click();
        await nextTick();
        expect(disabled.value.value).toBe(false);

        const readonly = mountBox({ readonly: true, label: 'Locked' });
        expect(readonly.input().getAttribute('aria-readonly')).toBe('true');
        readonly.input().click();
        await nextTick();
        expect(readonly.value.value).toBe(false);
        expect(readonly.input().checked).toBe(false);
    });

    it('sends class and style to the wrapper and every other attribute to the input', () => {
        const wrapper = mountVt(Checkbox, { props: { binary: true }, attrs: { id: 'terms', name: 'terms', class: 'spaced', 'aria-describedby': 'terms-hint' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-checkbox', 'spaced']));
        expect(wrapper.get('input').attributes()).toMatchObject({ id: 'terms', name: 'terms', 'aria-describedby': 'terms-hint' });
    });

    it('marks an invalid box for assistive technology', () => {
        const { input, wrapper } = mountBox({ invalid: true });
        expect(input().getAttribute('aria-invalid')).toBe('true');
        expect(wrapper.find('.vt-checkbox').classes()).toContain('vt-checkbox-invalid');
    });

    it('stays keyboard reachable: Tab lands on the native input, and Space is left to the browser', async () => {
        const { input, value } = mountBox();
        expect(input().tabIndex).toBe(0);
        input().focus();
        expect(document.activeElement).toBe(input());
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        input().dispatchEvent(space);
        expect(space.defaultPrevented).toBe(false);
        await press(input(), 'Tab');
        expect(value.value).toBe(false);
    });

    it('has no accessibility violations: unchecked, checked, mixed, disabled, slotted label', async () => {
        mountBox();
        mountBox({ label: 'Checked' }, true);
        mountVt(Checkbox, { props: { binary: true, indeterminate: true, label: 'Mixed' } });
        mountVt(Checkbox, { props: { binary: true, disabled: true, invalid: true, label: 'Disabled' } });
        mountVt(Checkbox, { props: { binary: true }, slots: { default: () => h('span', ['I accept the ', h('strong', 'terms')]) } });
        mountVt(Checkbox, { props: { binary: true }, attrs: { 'aria-label': 'Select row' } });
        await expectNoA11yViolations();
    });
});
