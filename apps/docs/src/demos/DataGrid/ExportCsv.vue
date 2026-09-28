<script setup lang="ts">
import { Button, Column, DataGrid } from '@vitral/vue';
import { ref } from 'vue';

const invoices = [
    { id: 1041, customer: 'Ximena Diallo', city: 'São Paulo', total: 1280.5, issued: new Date(2026, 7, 3) },
    { id: 1042, customer: 'Noémie Nowak', city: 'Zürich', total: 318, issued: new Date(2026, 7, 11) },
    { id: 1043, customer: 'Lima, Bruno', city: 'Kraków', total: 94.9, issued: new Date(2026, 7, 19) },
    { id: 1044, customer: '=cmd', city: 'Tōkyō', total: 2210, issued: new Date(2026, 8, 2) }
];
const selection = ref([]);
const table = ref<InstanceType<typeof DataGrid> | null>(null);
const day = (row: { issued: Date }) => row.issued.toISOString().slice(0, 10);
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
            <Button label="Export every row" icon="download" size="small" @click="table?.exportCSV({ filename: 'invoices.csv' })" />
            <Button label="Export the selection" icon="download" size="small" variant="outlined" :disabled="!selection.length" @click="table?.exportCSV({ filename: 'selected.csv', scope: 'selection' })" />
        </div>
        <DataGrid ref="table" v-model:selection="selection" :value="invoices" data-key="id" aria-label="Invoices" style="width: 100%">
            <Column selection-mode="multiple" />
            <Column field="id" header="Invoice" />
            <Column field="customer" header="Customer" sortable />
            <Column field="city" header="City" />
            <Column field="total" header="Total" align="right" sortable />
            <Column field="issued" header="Issued" :export-value="day">
                <template #body="{ data }">{{ data.issued.toLocaleDateString() }}</template>
            </Column>
        </DataGrid>
    </div>
</template>
