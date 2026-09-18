import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import HoverCard from './HoverCard.vue';

function mountCard(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(HoverCard, {
        props,
        slots: { trigger: () => h('a', { href: '#/profile' }, '@vitral'), default: () => h('p', 'A component set for Vue.') }
    });
    const trigger = () => document.querySelector<HTMLElement>('.vt-hovercard-trigger')!;
    const link = () => document.querySelector<HTMLAnchorElement>('a')!;
    const card = () => document.querySelector<HTMLElement>('.vt-hovercard');
    return { wrapper, trigger, link, card };
}

describe('HoverCard', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('opens after the pointer rests, stays while it is over the card, and closes after it leaves', async () => {
        const { trigger, card, wrapper } = mountCard();
        trigger().dispatchEvent(new Event('pointerenter'));
        vi.advanceTimersByTime(600);
        await nextTick();
        expect(card()).toBeNull();
        vi.advanceTimersByTime(100);
        await nextTick();
        expect(card()?.textContent).toBe('A component set for Vue.');
        trigger().dispatchEvent(new Event('pointerleave'));
        vi.advanceTimersByTime(100);
        card()!.dispatchEvent(new Event('pointerenter'));
        vi.advanceTimersByTime(1000);
        await nextTick();
        expect(card()).not.toBeNull();
        card()!.dispatchEvent(new Event('pointerleave'));
        vi.advanceTimersByTime(300);
        await nextTick();
        expect(card()).toBeNull();
        expect(wrapper.emitted('show')).toHaveLength(1);
        expect(wrapper.emitted('hide')).toHaveLength(1);
    });

    it('opens on keyboard focus without taking it, and closes on Escape', async () => {
        const { link, card } = mountCard({ openDelay: 0 });
        vi.spyOn(link(), 'matches').mockReturnValue(true);
        link().focus();
        await nextTick();
        expect(card()).not.toBeNull();
        expect(document.activeElement).toBe(link());
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await nextTick();
        expect(card()).toBeNull();
    });

    it('stays closed when disabled', async () => {
        const { trigger, card } = mountCard({ disabled: true, openDelay: 0 });
        trigger().dispatchEvent(new Event('pointerenter'));
        await nextTick();
        expect(card()).toBeNull();
    });

    it('has no accessibility violations, closed or open', async () => {
        vi.useRealTimers();
        const { trigger } = mountCard({ openDelay: 0 });
        await expectNoA11yViolations();
        trigger().dispatchEvent(new Event('pointerenter'));
        await nextTick();
        await expectNoA11yViolations();
    });
});
