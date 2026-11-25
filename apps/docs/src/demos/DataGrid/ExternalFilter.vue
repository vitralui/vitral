<script setup lang="ts">
import { Column, DataGrid, Icon, InputText, SelectButton } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Item {
    id: number;
    name: string;
    category: string;
    stock: number;
    reorder: number;
}

const items: Item[] = [
    { id: 1, name: 'Espresso beans, 1 kg', category: 'Coffee', stock: 42, reorder: 20 },
    { id: 2, name: 'Oat milk, 1 l', category: 'Dairy-free', stock: 6, reorder: 24 },
    { id: 3, name: 'Paper cups, 250', category: 'Supplies', stock: 0, reorder: 10 },
    { id: 4, name: 'Filter papers, 100', category: 'Supplies', stock: 18, reorder: 15 },
    { id: 5, name: 'Decaf beans, 500 g', category: 'Coffee', stock: 3, reorder: 8 },
    { id: 6, name: 'Almond milk, 1 l', category: 'Dairy-free', stock: 30, reorder: 12 },
    { id: 7, name: 'Lids, 250', category: 'Supplies', stock: 0, reorder: 10 }
];

const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const show = ref<'all' | 'low' | 'out'>('all');
const choices = [
    { label: 'Everything', value: 'all' },
    { label: 'To reorder', value: 'low' },
    { label: 'Sold out', value: 'out' }
];
// A filter of the page's own: a new function, and the grid filters again, under its search and its sort.
const keep = computed(() => (show.value === 'out' ? (item: Item) => item.stock === 0 : show.value === 'low' ? (item: Item) => item.stock < item.reorder : undefined));
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: space-between">
            <SelectButton v-model="show" :options="choices" option-label="label" option-value="value" size="small" :allow-empty="false" aria-label="Show" />
            <InputText v-model="filters.global.value" placeholder="Search stock" aria-label="Search stock" size="small" clearable>
                <template #prefix><Icon icon="search" /></template>
            </InputText>
        </div>
        <DataGrid v-model:filters="filters" :value="items" data-key="id" aria-label="Stock" :external-filter="keep" :global-filter-fields="['name', 'category']" sort-field="stock" :sort-order="1" style="width: 100%">
            <Column field="name" header="Item" sortable />
            <Column field="category" header="Category" sortable />
            <Column field="stock" header="In stock" align="right" sortable />
            <Column field="reorder" header="Reorder at" align="right" />
        </DataGrid>
    </div>
</template>
