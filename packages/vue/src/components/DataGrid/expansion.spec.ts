import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mountVt } from '../../../test/utils';
import { Column, DataGrid } from './index';

describe('DataGrid row expansion', () => {
    it('draws the expansion slot under a row its expander column opens, with the model following', async () => {
        const open = ref<(string | number)[]>([]);
        const wrapper = mountVt(
            defineComponent(() => () =>
                h(
                    DataGrid,
                    { value: [{ id: 7, name: 'Ana' }], dataKey: 'id', 'aria-label': 'People', expandedRows: open.value, 'onUpdate:expandedRows': (v: (string | number)[] | null | undefined) => (open.value = v ?? []) },
                    { default: () => [h(Column, { expander: true }), h(Column, { field: 'name', header: 'Name' })], expansion: ({ data }: { data: { name: string } }) => h('em', `Details of ${data.name}`) }
                )
            )
        );
        await nextTick();
        await wrapper.get('.vt-datagrid-expander').trigger('click');
        await nextTick();
        expect(open.value).toEqual([7]);
        expect(wrapper.get('.vt-datagrid-expansion-row em').text()).toBe('Details of Ana');
    });
});
