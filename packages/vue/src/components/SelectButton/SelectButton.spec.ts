import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import SelectButton from './SelectButton.vue';

const options = [
    { label: 'Left', value: 'l' },
    { label: 'Centre', value: 'c' },
    { label: 'Right', value: 'r', disabled: true }
];

const props = { options, optionLabel: 'label', optionValue: 'value', optionDisabled: 'disabled', label: 'Alignment' };

describe('SelectButton', () => {
    it('is a group of toggle buttons that say what is on', () => {
        const wrapper = mountVt(SelectButton, { props: { ...props, modelValue: 'c' } });
        expect(wrapper.attributes('role')).toBe('group');
        expect(wrapper.attributes('aria-label')).toBe('Alignment');
        const buttons = wrapper.findAll('button');
        expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['false', 'true', 'false']);
        expect(buttons[2]!.attributes('disabled')).toBeDefined();
    });

    it('selects, and clears when pressed again', async () => {
        const wrapper = mountVt(SelectButton, { props });
        await wrapper.findAll('button')[0]!.trigger('click');
        expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['l']);

        await wrapper.setProps({ modelValue: 'l' });
        await wrapper.findAll('button')[0]!.trigger('click');
        expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null]);
    });

    it('keeps a value when allowEmpty is off', async () => {
        const wrapper = mountVt(SelectButton, { props: { ...props, modelValue: 'l', allowEmpty: false } });
        await wrapper.findAll('button')[0]!.trigger('click');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('collects several values when multiple', async () => {
        const wrapper = mountVt(SelectButton, { props: { ...props, multiple: true, modelValue: ['l'] } });
        await wrapper.findAll('button')[1]!.trigger('click');
        expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['l', 'c']]);
    });

    it('is one tab stop, with the arrows moving inside it', async () => {
        const wrapper = mountVt(SelectButton, { props: { ...props, modelValue: 'c' } });
        const buttons = wrapper.findAll('button');
        expect(buttons.map((b) => b.attributes('tabindex'))).toEqual(['-1', '0', '-1']);

        // Right from the middle skips the disabled one and wraps to the first.
        await press(buttons[1]!.element, 'ArrowRight');
        expect(document.activeElement).toBe(buttons[0]!.element);
        await press(buttons[0]!.element, 'End');
        expect(document.activeElement).toBe(buttons[1]!.element);
    });

    it('has no accessibility violations', async () => {
        mountVt(SelectButton, { props: { ...props, modelValue: 'c' } });
        await expectNoA11yViolations();
    });
});
