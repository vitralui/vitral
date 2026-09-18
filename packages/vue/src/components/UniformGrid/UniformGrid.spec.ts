import { describe, expect, it } from 'vitest';
import { createCommentVNode, defineComponent, Fragment, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import UniformGrid from './UniformGrid.vue';

const styleOf = (el: Element) => (el as HTMLElement).style;
const cells = (count: number) => () => Array.from({ length: count }, (_, i) => h('div', { class: 'cell' }, `${i + 1}`));

describe('UniformGrid', () => {
    it('is a square just big enough for its children when given neither dimension', () => {
        const wrapper = mountVt(UniformGrid, { slots: { default: cells(5) } });
        const style = styleOf(wrapper.element);
        expect(style.display).toBe('grid');
        expect(style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
        expect(style.gridTemplateRows).toBe('repeat(3, minmax(0, 1fr))');
        expect(style.gap).toBe('var(--vt-uniformgrid-spacing)');
        expect(wrapper.findAll('.cell')).toHaveLength(5);
    });

    it('works out the missing dimension from the children, and follows them as they change', async () => {
        const count = ref(7);
        const wrapper = mountVt(
            defineComponent(() => () => h(UniformGrid, { columns: 3 }, () => Array.from({ length: count.value }, (_, i) => h('div', { key: i, class: 'cell' }, `${i + 1}`))))
        );
        const root = () => wrapper.get('.vt-uniformgrid').element;
        expect(styleOf(root()).gridTemplateRows).toBe('repeat(3, minmax(0, 1fr))');
        count.value = 10;
        await nextTick();
        expect(styleOf(root()).gridTemplateRows).toBe('repeat(4, minmax(0, 1fr))');
        expect(wrapper.findAll('.cell')).toHaveLength(10);
    });

    it('derives columns from rows', () => {
        const wrapper = mountVt(UniformGrid, { props: { rows: 2, spacing: 6 }, slots: { default: cells(7) } });
        expect(styleOf(wrapper.element).gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
        expect(styleOf(wrapper.element).gap).toBe('6px');
    });

    it('counts what renders: fragments open, v-if placeholders and whitespace do not count', () => {
        const wrapper = mountVt(UniformGrid, {
            slots: { default: () => [h('div', 'a'), createCommentVNode('v-if'), h(Fragment, [h('div', 'b'), h('div', 'c'), h('div', 'd')]), h('div', 'e')] }
        });
        expect(wrapper.element.children).toHaveLength(5);
        expect(styleOf(wrapper.element).gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    });

    it('leaves firstColumn empty cells before the first child, when it fits in the columns', async () => {
        const wrapper = mountVt(UniformGrid, { props: { columns: 3, firstColumn: 2 }, slots: { default: cells(4) } });
        const first = () => wrapper.element.children[0] as HTMLElement;
        expect(first().style.gridColumnStart).toBe('3');
        expect((wrapper.element.children[1] as HTMLElement).style.gridColumnStart).toBe('');
        expect(styleOf(wrapper.element).gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');
        await wrapper.setProps({ firstColumn: 3 });
        expect(first().style.gridColumnStart).toBe('');
    });

    it('keeps its grid unstyled', () => {
        const bare = mountVt(UniformGrid, { props: { unstyled: true, columns: 2 }, slots: { default: cells(4) } });
        expect(bare.classes()).toEqual([]);
        expect(styleOf(bare.element).gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    });

    it('has no accessibility violations', async () => {
        mountVt(UniformGrid, { props: { as: 'ul', columns: 2 }, slots: { default: () => ['One', 'Two', 'Three'].map((t) => h('li', t)) } });
        await expectNoA11yViolations();
    });
});
