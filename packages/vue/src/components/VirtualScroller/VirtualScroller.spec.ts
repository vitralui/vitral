import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import VirtualScroller from './VirtualScroller.vue';

const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);
const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');

function mountScroller(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(VirtualScroller, {
        props: { items, itemSize: 20, scrollHeight: '200px', numToleratedItems: 2, 'aria-label': 'Items', ...props },
        slots: { item: ({ item }: { item: string }) => h('div', { class: 'row' }, item) }
    });
    const root = () => wrapper.element as HTMLElement;
    const rows = () => Array.from(document.querySelectorAll('.row')).map((r) => r.textContent);
    const scrollTo = async (top: number) => {
        root().scrollTop = top;
        root().dispatchEvent(new Event('scroll'));
        await nextTick();
    };
    return { wrapper, root, rows, scrollTo };
}

describe('VirtualScroller', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 200 });
    });
    afterEach(() => {
        if (original) Object.defineProperty(HTMLElement.prototype, 'clientHeight', original);
    });

    it('renders only the items near the viewport, in a spacer as long as all of them', async () => {
        const { rows, root } = mountScroller();
        await nextTick();
        expect(rows()).toEqual(Array.from({ length: 12 }, (_, i) => `Item ${i}`));
        expect((root().querySelector('.vt-virtualscroller-spacer') as HTMLElement).style.height).toBe('200000px');
    });

    it('follows the scroll, reporting the visible range', async () => {
        const { rows, scrollTo, wrapper } = mountScroller();
        await nextTick();
        await scrollTo(1000);
        expect(rows()[0]).toBe('Item 48');
        expect(rows()).toHaveLength(14);
        expect((document.querySelector('.vt-virtualscroller-content') as HTMLElement).style.transform).toBe('translateY(960px)');
        expect(wrapper.emitted('scroll-index-change')?.at(-1)).toEqual([{ first: 50, last: 60 }]);
    });

    it('asks for ranges in lazy mode and marks itself busy while loading', async () => {
        const { wrapper, root, scrollTo } = mountScroller({ lazy: true, loading: true });
        await nextTick();
        expect(wrapper.emitted('lazy-load')?.[0]).toEqual([{ first: 0, last: 12 }]);
        expect(root().getAttribute('aria-busy')).toBe('true');
        expect(root().querySelector('.vt-sr-only')?.textContent).toBe('Loading…');
        await scrollTo(400);
        expect(wrapper.emitted('lazy-load')?.at(-1)).toEqual([{ first: 18, last: 32 }]);
    });

    it('scrolls an item into view, and renders everything when disabled', async () => {
        const { wrapper, root } = mountScroller();
        await nextTick();
        (wrapper.vm as unknown as { scrollToIndex: (i: number) => void }).scrollToIndex(300);
        await nextTick();
        expect(root().scrollTop).toBe(6000);
        const all = mountScroller({ items: items.slice(0, 30), disabled: true });
        await nextTick();
        expect(all.root().querySelectorAll('.row')).toHaveLength(30);
    });

    it('is a named, focusable scroll region without accessibility violations', async () => {
        const { root } = mountScroller();
        await nextTick();
        expect(root().tabIndex).toBe(0);
        expect(root().getAttribute('aria-label')).toBe('Items');
        await expectNoA11yViolations();
    });
});
