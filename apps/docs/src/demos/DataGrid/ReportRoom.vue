<script setup lang="ts">
import { Column, DataGrid, Tag } from '@vitral/vue';

const orders = [
    { id: 1041, customer: 'Ana Souza', items: 3, total: 418.5, status: 'Quarantine' },
    { id: 1042, customer: 'Bruno Lima', items: 1, total: 89.9, status: 'Packed' },
    { id: 1043, customer: 'Carla Mendes', items: 6, total: 1240, status: 'Shipped' }
];
const severity = (status: string) => (status === 'Shipped' ? 'success' : status === 'Packed' ? 'info' : 'warn');
</script>

<template>
    <DataGrid
        :value="orders"
        data-key="id"
        aria-label="Orders"
        toolbar
        dictionary-drawer
        dictionary-module="Orders"
        dictionary-subtitle="What each column of the list holds."
        :side-bar="['columns']"
        fill-rows
        min-height="20rem"
        striped-rows
        show-gridlines
        resizable-columns
        responsive-layout="stack"
        :breakpoint="640"
        class="demo-table"
    >
        <Column field="id" header="Order" :width="110" description="The order's number." kind="dimension" source="orders.number" />
        <Column field="customer" header="Customer" :width="240" description="Who placed it." kind="dimension" />
        <Column field="items" header="Items" :width="100" align="right" description="Lines on the order." kind="metric" />
        <Column field="total" header="Total" :width="140" align="right" description="What the order is worth." kind="metric" formula="Σ line totals" />
        <Column field="status" header="Status" :width="150" description="Where the order stands." :notes="['Quarantine holds an order until its checklist is done.']">
            <template #body="{ data }">
                <Tag :value="data.status" :severity="severity(data.status)" />
            </template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
