<script setup lang="ts">
import { Button, Column, DataGrid, StackPanel, useVitral, type ColumnLayoutLike } from '@vitral/vue';
import { computed, ref } from 'vue';

const people = [
    { id: 1, name: 'Ximena Diallo', city: 'São Paulo', country: 'Brazil', balance: 4586.25, status: 'Offline' },
    { id: 2, name: 'Noémie Nowak', city: 'Zürich', country: 'Switzerland', balance: 5484.63, status: 'Offline' },
    { id: 3, name: 'Bruno Nowak', city: 'Kraków', country: 'Poland', balance: 456.73, status: 'Away' },
    { id: 4, name: 'Quentin Gómez', city: 'Tōkyō', country: 'Japan', balance: 5444.92, status: 'Active' },
    { id: 5, name: 'Hanna Mendes', city: 'Reykjavík', country: 'Iceland', balance: 16745.23, status: 'Away' },
    { id: 6, name: 'Wiktor Lima', city: 'Kraków', country: 'Poland', balance: 6428.86, status: 'Active' },
    { id: 7, name: 'Bruno Rocha', city: 'Tōkyō', country: 'Japan', balance: 8297.1, status: 'Active' },
    { id: 8, name: 'Gustavo Rocha', city: 'Québec', country: 'Canada', balance: 10280.87, status: 'Active' }
];

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));

// What the reader has done to the columns: an application would store this.
const layout = ref<ColumnLayoutLike | null>(null);
const layoutSummary = computed(() => {
    const it = layout.value;
    if (!it) return 'Nothing changed yet.';
    const parts = [
        it.order?.length ? `order: ${it.order.join(', ')}` : '',
        it.hidden?.length ? `hidden: ${it.hidden.join(', ')}` : '',
        Object.keys(it.widths ?? {}).length ? `${Object.keys(it.widths!).length} widths` : ''
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Nothing changed yet.';
});
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <DataGrid
            v-model:column-layout="layout"
            :value="people"
            data-key="id"
            aria-label="People, arranged"
            resizable-columns
            reorderable-columns
            column-toggle
            scrollable
            size="small"
            show-gridlines
            class="demo-table"
            style="max-width: 100%"
        >
            <Column field="name" header="Name" sortable pinned="left" :width="180" />
            <Column field="country" header="Country" sortable :width="140" />
            <Column field="city" header="City" sortable :width="160" />
            <Column field="role" header="Role" :width="150" />
            <Column field="status" header="Status" :width="120" />
            <Column field="balance" header="Balance" align="right" pinned="right" :width="130">
                <template #body="{ data }">{{ money.format(data.balance) }}</template>
            </Column>
        </DataGrid>
        <div class="demo-table-bar">
            <Button size="small" severity="secondary" variant="outlined" @click="layout = null">Reset the layout</Button>
            <small style="color: var(--vt-text-muted-color)">{{ layoutSummary }}</small>
        </div>
    </StackPanel>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}
</style>
