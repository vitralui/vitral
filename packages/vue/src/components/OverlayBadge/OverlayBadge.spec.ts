import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import OverlayBadge from './OverlayBadge.vue';

function mountOverlay(props: Record<string, unknown> = {}) {
    return mountVt(OverlayBadge, {
        props,
        slots: { default: ({ badgeId }: { badgeId?: string }) => h('button', { 'aria-describedby': badgeId }, 'Notifications') }
    });
}

describe('OverlayBadge', () => {
    it('pins a badge that assistive technology skips, and repeats its text where it can be referenced', () => {
        const wrapper = mountOverlay({ value: 4, severity: 'danger' });
        const badge = wrapper.get('.vt-badge');
        expect(badge.attributes('aria-hidden')).toBe('true');
        expect(badge.classes()).toEqual(expect.arrayContaining(['vt-overlaybadge-badge', 'vt-badge-danger']));
        const button = wrapper.get('button');
        const text = document.getElementById(button.attributes('aria-describedby')!)!;
        expect(text.textContent).toBe('4');
        expect(text.style.position).toBe('absolute');
    });

    it('hides the text even unstyled', () => {
        const wrapper = mountOverlay({ value: 2, unstyled: true });
        const text = document.getElementById(wrapper.get('button').attributes('aria-describedby')!)!;
        expect(text.style.clip).toContain('rect');
        expect(wrapper.get('[aria-hidden="true"]').classes()).toEqual([]);
    });

    it('has nothing to describe when it is a dot', () => {
        const wrapper = mountOverlay();
        expect(wrapper.get('button').attributes('aria-describedby')).toBeUndefined();
        expect(wrapper.get('.vt-badge').classes()).toContain('vt-badge-dot');
    });

    it('has no accessibility violations', async () => {
        mountOverlay({ value: 9 });
        await expectNoA11yViolations();
    });
});
