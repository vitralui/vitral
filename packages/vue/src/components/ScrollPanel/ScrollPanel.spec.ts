import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import ScrollPanel from './ScrollPanel.vue';

function mountPanel() {
    const wrapper = mountVt(ScrollPanel, {
        attrs: { 'aria-label': 'Terms', style: 'height: 200px' },
        slots: { default: () => h('p', 'Long text') }
    });
    const content = wrapper.find('.vt-scrollpanel-content').element as HTMLElement;
    Object.defineProperties(content, {
        clientHeight: { configurable: true, get: () => 200 },
        scrollHeight: { configurable: true, get: () => 800 },
        clientWidth: { configurable: true, get: () => 300 },
        scrollWidth: { configurable: true, get: () => 300 }
    });
    return { wrapper, content };
}

describe('ScrollPanel', () => {
    it('is a focusable, named scroll region whose drawn bar follows the scroll', async () => {
        const { wrapper, content } = mountPanel();
        expect(wrapper.attributes('style')).toContain('height: 200px');
        expect(content.getAttribute('aria-label')).toBe('Terms');
        expect(content.tabIndex).toBe(0);
        (wrapper.vm as unknown as { refresh: () => void }).refresh();
        await nextTick();
        const bar = wrapper.find('.vt-scrollpanel-bar-y');
        expect(bar.attributes('aria-hidden')).toBe('true');
        const thumb = bar.find('.vt-scrollpanel-thumb').element as HTMLElement;
        expect(thumb.style.height).toBe('50px');
        content.scrollTop = 300;
        content.dispatchEvent(new Event('scroll'));
        await nextTick();
        expect(thumb.style.transform).toBe('translateY(75px)');
        expect(wrapper.find('.vt-scrollpanel-bar-x').exists()).toBe(false);
    });

    it('scrolls when its thumb is dragged', async () => {
        const { wrapper, content } = mountPanel();
        (wrapper.vm as unknown as { refresh: () => void }).refresh();
        await nextTick();
        const thumb = wrapper.find('.vt-scrollpanel-thumb').element as HTMLElement;
        thumb.dispatchEvent(new PointerEvent('pointerdown', { clientY: 10, bubbles: true }));
        thumb.dispatchEvent(new PointerEvent('pointermove', { clientY: 85, bubbles: true }));
        expect(content.scrollTop).toBe(300);
        thumb.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        await nextTick();
        expect(wrapper.find('.vt-scrollpanel-bar-active').exists()).toBe(false);
    });

    it('has no accessibility violations', async () => {
        const { wrapper } = mountPanel();
        (wrapper.vm as unknown as { refresh: () => void }).refresh();
        await nextTick();
        await expectNoA11yViolations();
    });
});
