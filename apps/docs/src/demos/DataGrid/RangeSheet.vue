<script setup lang="ts">
import { Button, Chart, Column, DataGrid, StackPanel, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Line {
    id: number;
    item: string;
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
}

const months = [
    ['jan', 'Jan'],
    ['feb', 'Feb'],
    ['mar', 'Mar'],
    ['apr', 'Apr'],
    ['may', 'May'],
    ['jun', 'Jun']
] as const;

const budget = ref<Line[]>(
    ['Payroll', 'Rent', 'Software', 'Marketing', 'Travel', 'Office'].map((item, i) => {
        const base = [42_000, 8_500, 3_200, 6_000, 2_400, 1_100][i]!;
        return { id: i + 1, item, ...Object.fromEntries(months.map(([key], m) => [key, base + ((i * 7 + m * 11) % 9) * 150])) } as Line;
    })
);

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
const grid = ref<InstanceType<typeof DataGrid> | null>(null);

// The chart draws the block marked, or the whole budget while nothing is.
const marked = ref<{ rows: number[]; keys: string[]; values: unknown[][] } | null>(null);
const chart = computed(() => {
    const rows = marked.value?.rows ?? budget.value.map((_, at) => at);
    const keys = (marked.value?.keys ?? months.map(([key]) => key)).filter((key) => months.some(([month]) => month === key));
    return {
        categories: rows.map((at) => budget.value[at]?.item ?? ''),
        series: keys.map((key) => ({ name: months.find(([month]) => month === key)![1], data: rows.map((at) => Number(budget.value[at]?.[key as keyof Line] ?? 0)) }))
    };
});
const onRange = (event: { range: { rows: number[]; keys: string[] } | null; values: unknown[][] }) => (marked.value = event.range && event.range.rows.length * event.range.keys.length > 1 ? { ...event.range, values: event.values } : null);
const positive = (value: unknown) => (typeof value === 'number' && value < 0 ? 'Cannot be below zero' : true);
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <DataGrid
            ref="grid"
            :value="budget"
            data-key="id"
            aria-label="Budget"
            cell-selection
            fill-handle
            status-bar
            show-gridlines
            size="small"
            class="demo-table"
            @range-change="onRange"
        >
            <template #header>
                <div class="demo-table-bar">
                    <strong>First half budget</strong>
                    <span class="demo-muted">Drag over cells, then drag the corner square down or across</span>
                    <Button size="small" severity="secondary" variant="outlined" icon="download" label="Excel" class="demo-end" @click="grid?.exportExcel({ filename: 'budget.xlsx', sheetName: 'Budget' })" />
                </div>
            </template>
            <Column field="item" header="Item" :width="140" />
            <Column v-for="[key, label] in months" :key="key" :field="key" :header="label" align="right" editable :validate="positive">
                <template #body="{ data }">{{ money.format(data[key]) }}</template>
            </Column>
        </DataGrid>
        <Chart type="bar" :height="260" :series="chart.series" :options="{ xaxis: { categories: chart.categories }, legend: { position: 'bottom' } }" aria-label="The marked cells as a chart" />
    </StackPanel>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.demo-end {
    margin-inline-start: auto;
}

.demo-muted {
    color: var(--vt-text-muted-color);
}
</style>
