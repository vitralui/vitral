<script setup lang="ts">
import { Column, ColumnGroup, DataGrid, useVitral } from '@vitral/vue';
import { computed } from 'vue';

interface Sales {
    id: number;
    product: string;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
}

const products = ['Oak desk', 'Walnut shelf', 'Linen chair', 'Brass lamp', 'Wool rug', 'Glass vase', 'Cedar bench', 'Steel stool', 'Cotton throw', 'Clay pot'];

let seed = 5;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const units = () => 20 + Math.floor(random() * 180);

const sales: Sales[] = products.map((product, i) => ({ id: i + 1, product, q1: units(), q2: units(), q3: units(), q4: units() }));
const total = (row: Sales) => row.q1 + row.q2 + row.q3 + row.q4;

const { config } = useVitral();
const number = computed(() => new Intl.NumberFormat(config.locale.code));
</script>

<template>
    <DataGrid :value="sales" data-key="id" aria-label="Units sold by quarter" show-gridlines size="small" resizable-columns reorderable-columns scrollable class="demo-table">
        <Column field="product" header="Product" sortable pinned="left" :width="150" />
        <ColumnGroup header="First half">
            <ColumnGroup header="Q1">
                <Column field="q1" header="Units" sortable align="right" :width="90" />
            </ColumnGroup>
            <ColumnGroup header="Q2">
                <Column field="q2" header="Units" sortable align="right" :width="90" />
            </ColumnGroup>
        </ColumnGroup>
        <ColumnGroup header="Second half">
            <ColumnGroup header="Q3">
                <Column field="q3" header="Units" sortable align="right" :width="90" />
            </ColumnGroup>
            <ColumnGroup header="Q4">
                <Column field="q4" header="Units" sortable align="right" :width="90" />
            </ColumnGroup>
        </ColumnGroup>
        <Column column-key="total" header="Year" align="right" pinned="right" :width="100" :export-value="total">
            <template #body="{ data }">
                <strong>{{ number.format(total(data)) }}</strong>
            </template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
