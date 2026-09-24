<script setup lang="ts">
import { Column, DataGrid, StackPanel, useVitral } from '@vitral/vue';
import { computed } from 'vue';

const thisQuarter = [
    { id: 1, name: 'Ximena Diallo', city: 'São Paulo', country: 'Brazil', balance: 4586.25 },
    { id: 2, name: 'Noémie Nowak', city: 'Zürich', country: 'Switzerland', balance: 5484.63 },
    { id: 3, name: 'Bruno Nowak', city: 'Kraków', country: 'Poland', balance: 456.73 },
    { id: 4, name: 'Quentin Gómez', city: 'Tōkyō', country: 'Japan', balance: 5444.92 }
];
const lastQuarter = [
    { id: 5, name: 'Hanna Mendes', city: 'Reykjavík', country: 'Iceland', balance: 16745.23 },
    { id: 6, name: 'Wiktor Lima', city: 'Kraków', country: 'Poland', balance: 6428.86 },
    { id: 7, name: 'Bruno Rocha', city: 'Tōkyō', country: 'Japan', balance: 8297.1 },
    { id: 8, name: 'Gustavo Rocha', city: 'Québec', country: 'Canada', balance: 10280.87 }
];

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));
</script>

<template>
    <StackPanel spacing="0.5rem" style="width: 100%">
        <DataGrid :value="thisQuarter" data-key="id" aria-label="This quarter" group="quarters" resizable-columns reorderable-columns size="small" scrollable class="demo-table">
            <Column field="name" header="Name" :width="170" />
            <Column field="country" header="Country" :width="140" />
            <Column field="city" header="City" :width="150" />
            <Column field="balance" header="Balance" align="right" :width="130">
                <template #body="{ data }">{{ money.format(data.balance) }}</template>
            </Column>
        </DataGrid>
        <DataGrid :value="lastQuarter" data-key="id" aria-label="Last quarter" group="quarters" resizable-columns reorderable-columns size="small" scrollable class="demo-table">
            <Column field="name" header="Name" :width="170" />
            <Column field="country" header="Country" :width="140" />
            <Column field="city" header="City" :width="150" />
            <Column field="balance" header="Balance" align="right" :width="130">
                <template #body="{ data }">{{ money.format(data.balance) }}</template>
            </Column>
        </DataGrid>
    </StackPanel>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
