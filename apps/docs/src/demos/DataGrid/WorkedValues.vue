<script setup lang="ts">
import { Column, DataGrid, useVitral } from '@vitral/vue';
import { computed } from 'vue';

interface Line {
    id: number;
    product: string;
    size: string;
    price: number;
    quantity: number;
    discount: number;
}

const lines: Line[] = [
    { id: 1, product: 'Linen shirt', size: 'M', price: 89, quantity: 3, discount: 0 },
    { id: 2, product: 'Wool coat', size: 'XL', price: 420, quantity: 1, discount: 0.15 },
    { id: 3, product: 'Silk scarf', size: 'S', price: 65, quantity: 4, discount: 0.1 },
    { id: 4, product: 'Denim jacket', size: 'L', price: 180, quantity: 2, discount: 0 },
    { id: 5, product: 'Cotton tee', size: 'S', price: 29, quantity: 12, discount: 0.2 },
    { id: 6, product: 'Rain boots', size: 'M', price: 110, quantity: 2, discount: 0.05 }
];

// Sizes go smallest first, not in the alphabet's order.
const SIZES = ['S', 'M', 'L', 'XL'];
const bySize = (a: unknown, b: unknown) => SIZES.indexOf(a as string) - SIZES.indexOf(b as string);

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'USD' }));
const asMoney = (value: unknown) => (typeof value === 'number' ? money.value.format(value) : '');
const asShare = (value: unknown) => (typeof value === 'number' && value > 0 ? `${Math.round(value * 100)}%` : '');
const total = (row: Line) => row.price * row.quantity * (1 - row.discount);
</script>

<template>
    <DataGrid :value="lines" data-key="id" aria-label="Order lines" sort-field="total" :sort-order="-1" total-row class="demo-table">
        <Column field="product" header="Product" sortable />
        <Column field="size" header="Size" sortable :comparator="bySize" />
        <Column field="price" header="Price" align="right" sortable :value-formatter="asMoney" />
        <Column field="quantity" header="Qty" align="right" sortable aggregate="sum" />
        <Column field="discount" header="Discount" align="right" :value-formatter="asShare" />
        <Column column-key="total" header="Total" align="right" sortable filter="number" :value-getter="total" :value-formatter="asMoney" aggregate="sum" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
