import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Badge from './Badge.vue';

describe('Badge', () => {
    it('shows its value with severity and size', () => {
        const wrapper = mountVt(Badge, { props: { value: 12, severity: 'danger', size: 'large' } });
        expect(wrapper.text()).toBe('12');
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-badge', 'vt-badge-danger', 'vt-badge-lg']));
        expect(wrapper.classes()).not.toContain('vt-badge-dot');
    });

    it('is a dot without a value', () => {
        expect(mountVt(Badge).classes()).toContain('vt-badge-dot');
        expect(mountVt(Badge, { props: { value: 0 } }).classes()).not.toContain('vt-badge-dot');
    });

    it('has no accessibility violations', async () => {
        mountVt(Badge, { props: { value: 3 } });
        mountVt(Badge, { props: { severity: 'success' } });
        await expectNoA11yViolations();
    });
});
