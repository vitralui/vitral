import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Masonry from './Masonry.vue';

const frames = () => new Promise((resolve) => setTimeout(resolve, 40));

describe('Masonry', () => {
    it('places each item in the shortest column, keeping them in their order', async () => {
        const heights = [100, 50, 80, 30];
        const wrapper = mountVt(Masonry, {
            props: { columns: 2, gap: '10px' },
            slots: { default: () => heights.map((height, i) => h('div', { class: 'item', 'data-h': height }, `Item ${i + 1}`)) }
        });
        const root = wrapper.element as HTMLElement;
        Object.defineProperty(root, 'clientWidth', { value: 320 });
        root.querySelectorAll<HTMLElement>('.item').forEach((el) => (el.getBoundingClientRect = () => ({ height: Number(el.dataset.h), width: 155 }) as DOMRect));
        (wrapper.vm as unknown as { layout: () => void }).layout();
        await frames();
        const items = Array.from(root.querySelectorAll<HTMLElement>('.item'));
        expect(items.map((el) => el.textContent)).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4']);
        expect(wrapper.classes()).toContain('vt-masonry-laid');
        expect(items.map((el) => el.style.translate)).toEqual(['0px 0px', '165px 0px', '165px 60px', '0px 110px']);
        expect(root.style.height).toBe('140px');
    });

    it('has no accessibility violations', async () => {
        mountVt(Masonry, { slots: { default: () => [h('p', 'One'), h('p', 'Two')] } });
        await expectNoA11yViolations();
    });
});
