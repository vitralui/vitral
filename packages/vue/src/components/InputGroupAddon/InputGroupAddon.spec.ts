import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import InputGroupAddon from './InputGroupAddon.vue';

describe('InputGroupAddon', () => {
    it('renders its content in a div by default', () => {
        const wrapper = mountVt(InputGroupAddon, { slots: { default: 'kg' } });
        expect(wrapper.element.tagName).toBe('DIV');
        expect(wrapper.classes()).toContain('vt-inputgroupaddon');
        expect(wrapper.text()).toBe('kg');
    });

    it('can be the label of the field beside it', () => {
        const wrapper = mountVt(InputGroupAddon, { props: { as: 'label' }, attrs: { for: 'weight' }, slots: { default: 'kg' } });
        expect(wrapper.element.tagName).toBe('LABEL');
        expect(wrapper.attributes('for')).toBe('weight');
    });

    it('has no accessibility violations', async () => {
        mountVt(InputGroupAddon, { slots: { default: 'kg' } });
        await expectNoA11yViolations();
    });
});
