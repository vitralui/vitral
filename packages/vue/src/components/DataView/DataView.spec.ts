import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import DataView from './DataView.vue';

const products = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `Product ${String(i).padStart(2, '0')}`, price: (i * 7) % 30 }));

function mountView(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(DataView, {
        props: { value: products, ...props },
        slots: {
            list: ({ items }: { items: typeof products }) => h('ul', items.map((p) => h('li', { class: 'item' }, p.name))),
            grid: ({ items }: { items: typeof products }) => items.map((p) => h('div', { class: 'cell' }, p.name))
        }
    });
    const names = () => Array.from(document.querySelectorAll('.item, .cell')).map((el) => el.textContent);
    return { wrapper, names };
}

describe('DataView', () => {
    it('hands the items to the list template, sorted', () => {
        const { names } = mountView({ sortField: 'price', sortOrder: -1 });
        expect(names()).toHaveLength(30);
        expect(names()[0]).toBe('Product 17');
    });

    it('pages through the items with a paginator', async () => {
        const { names, wrapper } = mountView({ paginator: true, rows: 10 });
        expect(names()).toHaveLength(10);
        const next = document.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!;
        next.click();
        await nextTick();
        expect(names()[0]).toBe('Product 10');
        expect(wrapper.emitted('update:first')?.[0]).toEqual([10]);
        expect(wrapper.emitted('page')).toHaveLength(1);
    });

    it('switches to the grid template', async () => {
        const { wrapper } = mountView({ layout: 'grid' });
        expect(document.querySelectorAll('.cell')).toHaveLength(30);
        expect(wrapper.classes()).toContain('vt-dataview-grid');
        await wrapper.setProps({ layout: 'list' });
        expect(document.querySelectorAll('.cell')).toHaveLength(0);
    });

    it('says when it is empty, and when it is loading', async () => {
        const { wrapper } = mountView({ value: [] });
        expect(wrapper.text()).toContain('No available options');
        await wrapper.setProps({ loading: true });
        expect(wrapper.attributes('aria-busy')).toBe('true');
        expect(wrapper.find('[role="status"]').text()).toBe('Loading…');
    });

    it('shows the page it is given in lazy mode', () => {
        const { names } = mountView({ lazy: true, paginator: true, rows: 5, totalRecords: 100, value: products.slice(0, 5) });
        expect(names()).toHaveLength(5);
        expect(document.querySelector('[aria-label="Last page"]')).not.toBeNull();
    });

    it('has no accessibility violations', async () => {
        mountView({ paginator: true, rows: 6 });
        await expectNoA11yViolations();
    });
});
