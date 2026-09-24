<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';

const people = [
    { name: 'Ximena Diallo', city: 'São Paulo' },
    { name: 'Noémie Nowak', city: 'Zürich' },
    { name: 'Bruno Nowak', city: 'Kraków' },
    { name: 'Quentin Gómez', city: 'Tōkyō' }
];
</script>

<template>
    <DataGrid :value="[]" aria-label="Empty table" empty-message="No invoices this month" class="demo-table demo-table-half">
        <Column field="number" header="Invoice" />
        <Column field="amount" header="Amount" align="right" />
    </DataGrid>
    <DataGrid :value="people" aria-label="Loading table" loading class="demo-table demo-table-half">
        <Column field="name" header="Name" />
        <Column field="city" header="City" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-table-half {
    flex: 1 1 20rem;
    width: auto;
}
</style>
