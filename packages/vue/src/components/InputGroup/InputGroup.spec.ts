import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import InputGroup from './InputGroup.vue';

const slots = { default: '<span class="vt-inputgroupaddon">R$</span><input aria-label="Amount" class="vt-field" />' };

describe('InputGroup', () => {
    it('lays its children out as one control', () => {
        const wrapper = mountVt(InputGroup, { slots });
        expect(wrapper.classes()).toContain('vt-inputgroup');
        expect(wrapper.findAll('.vt-inputgroupaddon')).toHaveLength(1);
    });

    it('is a named group only when it has a name', () => {
        expect(mountVt(InputGroup, { slots }).attributes('role')).toBeUndefined();
        const named = mountVt(InputGroup, { props: { label: 'Amount' }, slots });
        expect(named.attributes('role')).toBe('group');
        expect(named.attributes('aria-label')).toBe('Amount');
    });

    it('has no accessibility violations', async () => {
        mountVt(InputGroup, { props: { label: 'Amount' }, slots });
        await expectNoA11yViolations();
    });
});
