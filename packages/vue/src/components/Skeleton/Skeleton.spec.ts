import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Skeleton from './Skeleton.vue';

describe('Skeleton', () => {
    it('is hidden from assistive technology', () => {
        expect(mountVt(Skeleton).attributes('aria-hidden')).toBe('true');
    });

    it('takes a shape and a size', () => {
        const wrapper = mountVt(Skeleton, { props: { shape: 'circle', width: '3rem' } });
        expect(wrapper.classes()).toContain('vt-skeleton-circle');
        // A circle with only a width is still a circle: the height follows it.
        expect(wrapper.attributes('style')).toContain('width: 3rem');
        expect(wrapper.attributes('style')).toContain('height: 3rem');
    });

    it('can drop the sweep', () => {
        expect(mountVt(Skeleton).classes()).toContain('vt-skeleton-animated');
        expect(mountVt(Skeleton, { props: { animated: false } }).classes()).not.toContain('vt-skeleton-animated');
    });

    it('has no accessibility violations', async () => {
        mountVt(Skeleton, { props: { width: '12rem' } });
        await expectNoA11yViolations();
    });
});
