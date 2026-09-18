import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import ProgressBar from './ProgressBar.vue';

describe('ProgressBar', () => {
    it('reports its value, range and name, and draws it', () => {
        const wrapper = mountVt(ProgressBar, { props: { value: 45 }, attrs: { 'aria-label': 'Upload' } });
        expect(wrapper.attributes()).toMatchObject({ role: 'progressbar', 'aria-valuenow': '45', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Upload' });
        expect(wrapper.get('.vt-progressbar-value').attributes('style')).toContain('width: 45%');
        expect(wrapper.get('.vt-progressbar-label').text()).toBe('45%');
    });

    it('clamps the value and spells out a custom unit', () => {
        const wrapper = mountVt(ProgressBar, { props: { value: 140, unit: ' files' }, attrs: { 'aria-label': 'Sync' } });
        expect(wrapper.attributes('aria-valuenow')).toBe('100');
        expect(wrapper.attributes('aria-valuetext')).toBe('100 files');
    });

    it('has no value while indeterminate', () => {
        const wrapper = mountVt(ProgressBar, { props: { mode: 'indeterminate' }, attrs: { 'aria-label': 'Working' } });
        expect(wrapper.attributes('aria-valuenow')).toBeUndefined();
        expect(wrapper.classes()).toContain('vt-progressbar-indeterminate');
        expect(wrapper.find('.vt-progressbar-label').exists()).toBe(false);
    });

    it('can hide its label', () => {
        const wrapper = mountVt(ProgressBar, { props: { value: 10, showValue: false }, attrs: { 'aria-label': 'Quiet' } });
        expect(wrapper.find('.vt-progressbar-label').exists()).toBe(false);
    });

    it('has no accessibility violations', async () => {
        mountVt(ProgressBar, { props: { value: 30 }, attrs: { 'aria-label': 'Download' } });
        mountVt(ProgressBar, { props: { mode: 'indeterminate' }, attrs: { 'aria-label': 'Connecting' } });
        await expectNoA11yViolations();
    });
});
