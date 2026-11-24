<script setup lang="ts">
import { Column, DataGrid, SelectButton, StackPanel, useVitral, type DataGridPivot } from '@vitral/vue';
import { computed, ref, watch } from 'vue';

interface Sale {
    id: number;
    region: string;
    product: string;
    year: number;
    quarter: string;
    revenue: number;
    units: number;
}

const regions = ['Europe', 'Americas', 'Asia Pacific'];
const products = ['Desk', 'Chair', 'Lamp', 'Shelf'];
// The same sales on every visit: a small hash of its own, rather than Math.random.
const pick = (n: number, count: number) => {
    let t = n + 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * count);
};
const sales = ref<Sale[]>(
    Array.from({ length: 240 }, (_, i) => {
        const product = pick(i + 500, 4);
        const units = pick(i + 2000, 9) + 1;
        return {
            id: i + 1,
            region: regions[pick(i, 3)]!,
            product: products[product]!,
            year: 2025 + pick(i + 1500, 2),
            quarter: `Q${pick(i + 1000, 4) + 1}`,
            units,
            revenue: units * [420, 160, 75, 230][product]!
        };
    })
);

const views = [
    { label: 'Rows', value: 'flat' },
    { label: 'By year', value: 'year' },
    { label: 'By year and quarter', value: 'quarter' }
];
const view = ref('year');

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
// Each view a pivot; the rows themselves are the pivot turned off, so the side bar still holds it.
const pivotOf = (name: string): DataGridPivot => ({
    enabled: name !== 'flat',
    rows: ['region', 'product'],
    columns: name === 'quarter' ? ['year', 'quarter'] : ['year'],
    values: [{ field: 'revenue' }]
});
const pivot = ref<DataGridPivot>(pivotOf(view.value));
watch(view, (name) => (pivot.value = pivotOf(name)));
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <SelectButton v-model="view" :options="views" option-label="label" option-value="value" :allow-empty="false" aria-label="View" size="small" />
        <DataGrid :value="sales" data-key="id" aria-label="Sales pivot" v-model:pivot="pivot" :side-bar="['pivot']" side-bar-open="pivot" sort-mode="multiple" :multi-sort-meta="[{ field: 'region', order: 1 }, { field: 'product', order: 1 }]" show-gridlines size="small" paginator :rows="12" class="demo-table">
            <Column field="region" header="Region" sortable />
            <Column field="product" header="Product" sortable />
            <Column field="year" header="Year" sortable />
            <Column field="quarter" header="Quarter" sortable />
            <Column field="units" header="Units" align="right" />
            <Column field="revenue" header="Revenue" align="right">
                <template #body="{ data }">{{ money.format(data.revenue) }}</template>
            </Column>
        </DataGrid>
    </StackPanel>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
