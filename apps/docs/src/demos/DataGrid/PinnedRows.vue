<script setup lang="ts">
import { Column, DataGrid, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Expense {
    id: number;
    item: string;
    team: string;
    planned: number;
    spent: number;
}

const expenses: Expense[] = [
    { id: 1, item: 'Office rent', team: 'Operations', planned: 4800, spent: 4800 },
    { id: 2, item: 'Cloud hosting', team: 'Engineering', planned: 2100, spent: 2460 },
    { id: 3, item: 'Design tools', team: 'Design', planned: 340, spent: 310 },
    { id: 4, item: 'Conference tickets', team: 'Marketing', planned: 1500, spent: 1180 },
    { id: 5, item: 'Laptops', team: 'Engineering', planned: 6200, spent: 6650 },
    { id: 6, item: 'Coffee', team: 'Operations', planned: 260, spent: 295 },
    { id: 7, item: 'Ads', team: 'Marketing', planned: 3000, spent: 2740 },
    { id: 8, item: 'User research', team: 'Design', planned: 900, spent: 720 },
    { id: 9, item: 'Monitoring', team: 'Engineering', planned: 480, spent: 480 },
    { id: 10, item: 'Insurance', team: 'Operations', planned: 1250, spent: 1250 },
    { id: 11, item: 'Translations', team: 'Marketing', planned: 600, spent: 845 },
    { id: 12, item: 'Training', team: 'Engineering', planned: 1100, spent: 940 }
];

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));

const filters = ref({ item: { value: null as string | null, matchMode: 'contains' }, team: { value: null as string | null, matchMode: 'contains' } });

// What the year allows, held at the top; and the totals of the rows the filters let through, at the bottom.
const target = [{ id: 'target', item: 'Budget for the year', team: '', planned: 25000, spent: 25000 }];
const totals = ({ rows }: { rows: Expense[] }) => [
    {
        id: 'total',
        item: `Total of ${rows.length}`,
        team: '',
        planned: rows.reduce((sum, row) => sum + row.planned, 0),
        spent: rows.reduce((sum, row) => sum + row.spent, 0)
    }
];
</script>

<template>
    <DataGrid
        v-model:filters="filters"
        :value="expenses"
        data-key="id"
        aria-label="Expenses"
        filter-display="row"
        scrollable
        scroll-height="320px"
        :pinned-top-rows="target"
        :pinned-bottom-rows="totals"
        class="demo-table"
    >
        <Column field="item" header="Item" sortable filter-placeholder="Item" />
        <Column field="team" header="Team" sortable filter-placeholder="Team" />
        <Column field="planned" header="Planned" sortable align="right">
            <template #body="{ data }">{{ money.format(data.planned) }}</template>
        </Column>
        <Column field="spent" header="Spent" sortable align="right">
            <template #body="{ data, pinned }">
                <template v-if="pinned === 'top'">{{ money.format(data.spent) }}</template>
                <span v-else :class="{ 'demo-over': data.spent > data.planned }">{{ money.format(data.spent) }}</span>
            </template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-over {
    color: var(--vt-danger-color);
}
</style>
