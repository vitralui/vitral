import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, withDirectives, resolveDirective } from 'vue';
import { expectNoA11yViolations } from '../../test/a11y';
import { mountVt, press } from '../../test/utils';
import { Tooltip, type TooltipDirectiveValue } from './tooltip';

function mountTooltip(value: TooltipDirectiveValue, modifiers: Record<string, boolean> = {}, vitral?: Parameters<typeof mountVt>[2]) {
    const bound = ref<TooltipDirectiveValue>(value);
    const wrapper = mountVt(
        defineComponent({
            directives: { tooltip: Tooltip },
            setup() {
                return () => withDirectives(h('button', { id: 'host' }, 'Save'), [[resolveDirective('tooltip')!, bound.value, undefined, modifiers]]);
            }
        }),
        {},
        vitral
    );
    const host = () => document.getElementById('host')!;
    const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]');
    return { wrapper, bound, host, tip };
}

describe('v-tooltip', () => {
    afterEach(() => vi.useRealTimers());

    it('shows on hover as a tooltip that describes its host, and hides on leave', async () => {
        vi.useFakeTimers();
        const { host, tip } = mountTooltip('Save the file');
        host().dispatchEvent(new MouseEvent('mouseenter'));
        expect(tip()!.textContent).toBe('Save the file');
        expect(tip()!.classList).toContain('vt-tooltip');
        expect(host().getAttribute('aria-describedby')).toBe(tip()!.id);
        host().dispatchEvent(new MouseEvent('mouseleave'));
        vi.advanceTimersByTime(200);
        expect(tip()).toBeNull();
        expect(host().hasAttribute('aria-describedby')).toBe(false);
    });

    it('shows on keyboard focus, hides on blur and on Escape', async () => {
        const { host, tip } = mountTooltip('Keyboard');
        const matches = host().matches.bind(host());
        vi.spyOn(host(), 'matches').mockImplementation((selector: string) => (selector === ':focus-visible' ? host() === document.activeElement : matches(selector)));
        host().focus();
        expect(tip()).not.toBeNull();
        await press(host(), 'Escape');
        expect(tip()).toBeNull();
        host().blur();
        host().focus();
        expect(tip()).not.toBeNull();
        host().blur();
        expect(tip()).toBeNull();
    });

    it('takes an options object, and follows changes to it', async () => {
        vi.useFakeTimers();
        const { bound, host, tip } = mountTooltip({ value: 'Later', showDelay: 400 });
        host().dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(300);
        expect(tip()).toBeNull();
        vi.advanceTimersByTime(100);
        expect(tip()!.textContent).toBe('Later');
        bound.value = { value: 'Changed' };
        await nextTick();
        expect(tip()!.textContent).toBe('Changed');
        bound.value = { value: 'Off', disabled: true };
        await nextTick();
        expect(tip()).toBeNull();
    });

    it('is placed by modifier', async () => {
        const { host, tip } = mountTooltip('Below', { bottom: true });
        host().dispatchEvent(new MouseEvent('mouseenter'));
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(tip()!.dataset.placement).toBe('bottom');
    });

    it('stacks on the tooltip layer from the configuration, and drops its class unstyled', () => {
        const { host, tip } = mountTooltip('Styled', {}, { theme: 'none', unstyled: true, zIndex: { tooltip: 3000 } });
        host().dispatchEvent(new MouseEvent('mouseenter'));
        expect(Number(tip()!.style.zIndex)).toBeGreaterThanOrEqual(3000);
        expect(tip()!.hasAttribute('class')).toBe(false);
    });

    it('takes global pass-through', () => {
        const { host, tip } = mountTooltip('Passed', {}, { theme: 'none', pt: { tooltip: { root: 'mine', text: { 'data-x': '1' } } } });
        host().dispatchEvent(new MouseEvent('mouseenter'));
        expect(tip()!.className).toBe('vt-tooltip mine');
        expect(tip()!.firstElementChild!.getAttribute('data-x')).toBe('1');
    });

    it('goes when its host does', () => {
        const { wrapper, host, tip } = mountTooltip('Bye');
        host().dispatchEvent(new MouseEvent('mouseenter'));
        wrapper.unmount();
        expect(tip()).toBeNull();
    });

    it('has no accessibility violations while shown', async () => {
        const { host } = mountTooltip('Accessible');
        host().dispatchEvent(new MouseEvent('mouseenter'));
        await expectNoA11yViolations();
    });
});
