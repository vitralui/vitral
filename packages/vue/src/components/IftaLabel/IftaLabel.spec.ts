import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import IftaLabel from './IftaLabel.vue';

const slots = { default: '<input id="city" class="vt-field-input" /><label for="city">City</label>' };

describe('IftaLabel', () => {
    it('wraps a field and its label', () => {
        const wrapper = mountVt(IftaLabel, { slots });
        expect(wrapper.classes()).toContain('vt-iftalabel');
        expect(wrapper.get('label').attributes('for')).toBe('city');
    });

    it('marks an invalid field', () => {
        expect(mountVt(IftaLabel, { props: { invalid: true }, slots }).classes()).toContain('vt-iftalabel-invalid');
    });

    it('has no accessibility violations', async () => {
        mountVt(IftaLabel, { slots });
        await expectNoA11yViolations();
    });
});
