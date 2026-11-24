import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { mountVt } from '../../../test/utils';
import Column from './Column.vue';
import DataGrid from './DataGrid.vue';

describe('DataGrid: editing', () => {
    it('writes an edit into the bound rows, where the rest of the page sees it', async () => {
        const items = ref([
            { id: 1, name: 'Desk', price: 100 },
            { id: 2, name: 'Lamp', price: 40 }
        ]);
        const total = computed(() => items.value.reduce((sum, item) => sum + item.price, 0));
        const completed: unknown[] = [];
        const wrapper = mountVt(
            defineComponent(
                () => () =>
                    h('div', [
                        h('output', String(total.value)),
                        h(DataGrid, { 'aria-label': 'Items', value: items.value, dataKey: 'id', 'onCellEditComplete': (event: unknown) => completed.push(event) }, () => [
                            h(Column, { field: 'name', header: 'Name' }),
                            h(Column, { field: 'price', header: 'Price', editable: true })
                        ])
                    ])
            )
        );
        await nextTick();
        const root = wrapper.element as HTMLElement;
        root.querySelector('td[data-col="price"]')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const box = root.querySelector('[data-editor]') as HTMLInputElement;
        box.value = '150';
        box.dispatchEvent(new Event('input', { bubbles: true }));
        box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await nextTick();
        expect(items.value[0]!.price).toBe(150);
        expect(root.querySelector('output')!.textContent).toBe('190');
        expect(completed).toHaveLength(1);
        // Undo is on without being asked for.
        root.querySelector('td[data-col="price"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
        await nextTick();
        expect(items.value[0]!.price).toBe(100);
        wrapper.unmount();
    });

    it('draws the #editor slot, which sets the value and keeps it', async () => {
        const items = ref([{ id: 1, size: 'S' }]);
        const wrapper = mountVt(
            defineComponent(
                () => () =>
                    h(DataGrid, { 'aria-label': 'Items', value: items.value, dataKey: 'id' }, () => [
                        h(
                            Column,
                            { field: 'size', header: 'Size', editable: true },
                            {
                                editor: ({ value, setValue, commit }: { value: unknown; setValue: (v: unknown) => void; commit: () => void }) =>
                                    ['S', 'M', 'L'].map((size) => h('button', { type: 'button', 'aria-pressed': String(size === value), onClick: () => (setValue(size), commit()) }, size))
                            }
                        )
                    ])
            )
        );
        await nextTick();
        const root = wrapper.element as HTMLElement;
        root.querySelector('td[data-col="size"]')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        await nextTick();
        const buttons = Array.from(root.querySelectorAll('td[data-editing] button')) as HTMLButtonElement[];
        expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
        buttons[2]!.click();
        await nextTick();
        expect(items.value[0]!.size).toBe('L');
        expect(root.querySelector('td[data-col="size"]')!.textContent).toBe('L');
        wrapper.unmount();
    });
});
