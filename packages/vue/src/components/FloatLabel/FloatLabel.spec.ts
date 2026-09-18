import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import FloatLabel from './FloatLabel.vue';

const slots = { default: '<input id="name" class="vt-field-input" placeholder=" " /><label for="name">Name</label>' };

describe('FloatLabel', () => {
    it('wraps a field and its label without touching the relation between them', () => {
        const wrapper = mountVt(FloatLabel, { slots });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-floatlabel', 'vt-floatlabel-over']));
        expect(wrapper.get('label').attributes('for')).toBe(wrapper.get('input').attributes('id'));
    });

    it('takes a variant, an invalid state and a filled flag', () => {
        const wrapper = mountVt(FloatLabel, { props: { variant: 'in', invalid: true, filled: true }, slots });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-floatlabel-in', 'vt-floatlabel-invalid', 'vt-floatlabel-filled']));
    });

    it('has no accessibility violations', async () => {
        mountVt(FloatLabel, { slots });
        await expectNoA11yViolations();
    });
});
