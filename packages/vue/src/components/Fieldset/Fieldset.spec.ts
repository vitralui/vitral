import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Fieldset from './Fieldset.vue';

const slots = { default: '<label for="f">Name</label><input id="f" />' };

describe('Fieldset', () => {
    it('is a fieldset with a legend', () => {
        const wrapper = mountVt(Fieldset, { props: { legend: 'Address' }, slots });
        expect(wrapper.element.tagName).toBe('FIELDSET');
        expect(wrapper.get('legend').text()).toBe('Address');
    });

    it('discloses its content when toggleable', async () => {
        const wrapper = mountVt(Fieldset, { props: { legend: 'Address', toggleable: true }, slots });
        const button = wrapper.get('legend button');
        const region = wrapper.get('[role="region"]');

        expect(button.attributes('aria-expanded')).toBe('true');
        expect(button.attributes('aria-controls')).toBe(region.attributes('id'));
        expect(region.attributes('aria-labelledby')).toBe(button.attributes('id'));

        await button.trigger('click');
        expect(button.attributes('aria-expanded')).toBe('false');
        expect(wrapper.emitted('toggle')![0]).toEqual([expect.objectContaining({ value: true })]);
    });

    it('is operated from the keyboard, because the toggle is a button', async () => {
        const wrapper = mountVt(Fieldset, { props: { legend: 'Address', toggleable: true }, slots });
        const button = wrapper.get('legend button');
        await press(button.element, 'Enter');
        await button.trigger('click');
        expect(wrapper.emitted('toggle')).toHaveLength(1);
    });

    it('has no accessibility violations', async () => {
        mountVt(Fieldset, { props: { legend: 'Address' }, slots });
        mountVt(Fieldset, { props: { legend: 'Billing', toggleable: true }, slots });
        await expectNoA11yViolations();
    });
});
