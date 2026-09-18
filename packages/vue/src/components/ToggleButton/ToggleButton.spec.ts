import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import ToggleButton from './ToggleButton.vue';

describe('ToggleButton', () => {
    it('is a button that says whether it is pressed', () => {
        const wrapper = mountVt(ToggleButton, { props: { onLabel: 'On', offLabel: 'Off' } });
        expect(wrapper.element.tagName).toBe('BUTTON');
        expect(wrapper.attributes('aria-pressed')).toBe('false');
        expect(wrapper.text()).toBe('Off');
    });

    it('toggles on a press, and reports the new value', async () => {
        const wrapper = mountVt(ToggleButton, { props: { onLabel: 'On', offLabel: 'Off' } });
        await wrapper.trigger('click');
        expect(wrapper.attributes('aria-pressed')).toBe('true');
        expect(wrapper.text()).toBe('On');
        expect(wrapper.emitted('change')![0]).toEqual([expect.objectContaining({ value: true })]);
        expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([true]);
    });

    it('toggles from the keyboard, because it is a button', async () => {
        const wrapper = mountVt(ToggleButton, { props: { onLabel: 'On', offLabel: 'Off' } });
        await press(wrapper.element, 'Enter');
        await wrapper.trigger('click');
        expect(wrapper.emitted('change')).toHaveLength(1);
    });

    it('shows the icon for the state it is in', async () => {
        const wrapper = mountVt(ToggleButton, { props: { onIcon: 'eye', offIcon: 'eyeOff', onLabel: 'Shown', offLabel: 'Hidden' } });
        expect(wrapper.find('svg.vt-togglebutton-icon').exists()).toBe(true);
        await wrapper.trigger('click');
        expect(wrapper.classes()).toContain('vt-togglebutton-checked');
    });

    it('has no accessibility violations', async () => {
        mountVt(ToggleButton, { props: { onLabel: 'On', offLabel: 'Off' } });
        mountVt(ToggleButton, { props: { onIcon: 'star', offIcon: 'star' }, attrs: { 'aria-label': 'Favourite' } });
        await expectNoA11yViolations();
    });
});
