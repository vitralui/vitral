import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import ScrollTop from './ScrollTop.vue';

describe('ScrollTop', () => {
    afterEach(() => vi.restoreAllMocks());

    it('appears past the threshold as a named button and scrolls the page back', async () => {
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        mountVt(ScrollTop, { props: { threshold: 100 } });
        expect(document.querySelector('button')).toBeNull();
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 150 });
        window.dispatchEvent(new Event('scroll'));
        await nextTick();
        const button = document.querySelector('button')!;
        expect(button.getAttribute('aria-label')).toBe('Scroll to top');
        button.click();
        expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        await nextTick();
        expect(document.querySelector('button')).toBeNull();
        await expectNoA11yViolations();
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    });

    it('scrolls its parent, and moves keyboard focus to the start of it', async () => {
        mountVt(
            defineComponent(() => () =>
                h('div', { id: 'box', style: 'height: 100px; overflow: auto' }, [h('a', { href: '#top', id: 'first' }, 'Top'), h(ScrollTop, { target: 'parent', threshold: 10 })])
            )
        );
        const box = document.getElementById('box')!;
        box.scrollTo = vi.fn();
        box.scrollTop = 50;
        box.dispatchEvent(new Event('scroll'));
        await nextTick();
        const button = box.querySelector('button')!;
        expect(button).not.toBeNull();
        button.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));
        expect(box.scrollTo).toHaveBeenCalled();
        expect(document.activeElement?.id).toBe('first');
    });
});
