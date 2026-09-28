<script setup lang="ts">
import { Column, DataGrid, Tag } from '@vitral/vue';
import { ref } from 'vue';

interface Order {
    id: number;
    customer: string;
    total: number;
    status: 'Paid' | 'Shipped' | 'Refunded';
    lines: { item: string; quantity: number; price: number }[];
}

const orders: Order[] = [
    { id: 1041, customer: 'Ana Souza', total: 184.5, status: 'Shipped', lines: [{ item: 'Linen shirt', quantity: 2, price: 62 }, { item: 'Canvas tote', quantity: 1, price: 60.5 }] },
    { id: 1042, customer: 'Kenji Sato', total: 39.9, status: 'Paid', lines: [{ item: 'Notebook, dotted', quantity: 3, price: 13.3 }] },
    { id: 1043, customer: 'Lucía Gómez', total: 312, status: 'Refunded', lines: [{ item: 'Desk lamp', quantity: 1, price: 212 }, { item: 'Bulb, warm', quantity: 4, price: 25 }] },
    { id: 1044, customer: 'Søren Jónsson', total: 76.2, status: 'Paid', lines: [{ item: 'Wool socks', quantity: 3, price: 25.4 }] }
];
const expanded = ref<(string | number)[]>([1041]);
const money = (value: number) => value.toLocaleString('en', { style: 'currency', currency: 'EUR' });
</script>

<template>
    <DataGrid v-model:expanded-rows="expanded" :value="orders" data-key="id" aria-label="Orders" style="width: 100%">
        <Column expander />
        <Column field="id" header="Order" />
        <Column field="customer" header="Customer" />
        <Column field="total" header="Total" align="right">
            <template #body="{ data }">{{ money(data.total) }}</template>
        </Column>
        <Column field="status" header="Status">
            <template #body="{ data }"><Tag :value="data.status" :severity="data.status === 'Refunded' ? 'danger' : data.status === 'Shipped' ? 'info' : 'success'" /></template>
        </Column>
        <template #expansion="{ data }">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem">
                <caption style="text-align: start; font-weight: 600; padding-bottom: 0.25rem">Lines of order {{ data.id }}</caption>
                <thead>
                    <tr><th style="text-align: start">Item</th><th style="text-align: end">Qty</th><th style="text-align: end">Price</th></tr>
                </thead>
                <tbody>
                    <tr v-for="line in data.lines" :key="line.item">
                        <td>{{ line.item }}</td>
                        <td style="text-align: end">{{ line.quantity }}</td>
                        <td style="text-align: end">{{ money(line.price) }}</td>
                    </tr>
                </tbody>
            </table>
        </template>
    </DataGrid>
    <p style="margin: 0.75rem 0 0">Open: {{ expanded.length ? expanded.join(', ') : 'none' }}</p>
</template>
