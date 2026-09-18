import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Divider from './Divider.vue';

describe('Divider', () => {
    it('is a horizontal separator by default', () => {
        const wrapper = mountVt(Divider);
        expect(wrapper.attributes('role')).toBe('separator');
        expect(wrapper.attributes('aria-orientation')).toBe('horizontal');
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-divider', 'vt-divider-horizontal', 'vt-divider-left']));
        expect(wrapper.classes()).not.toContain('vt-divider-with-content');
    });

    it('announces a vertical orientation and centres content there by default', () => {
        const wrapper = mountVt(Divider, { props: { layout: 'vertical' }, slots: { default: () => 'or' } });
        expect(wrapper.attributes('aria-orientation')).toBe('vertical');
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-divider-vertical', 'vt-divider-center', 'vt-divider-with-content']));
        expect(wrapper.get('.vt-divider-content').text()).toBe('or');
    });

    it('takes a line type and an alignment', () => {
        const wrapper = mountVt(Divider, { props: { type: 'dashed', align: 'right' }, slots: { default: () => 'Details' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-divider-dashed', 'vt-divider-right']));
        expect(mountVt(Divider, { props: { type: 'solid' } }).classes()).not.toContain('vt-divider-solid');
    });

    it('has no accessibility violations', async () => {
        mountVt(Divider);
        mountVt(Divider, { props: { layout: 'vertical', type: 'dotted' } });
        mountVt(Divider, { props: { align: 'center' }, slots: { default: () => 'Section' } });
        await expectNoA11yViolations();
    });
});
