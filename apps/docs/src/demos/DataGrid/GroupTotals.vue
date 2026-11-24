<script setup lang="ts">
import { chevronsDownUp, chevronsUpDown } from '@vitral/icons';
import { Button, Column, DataGrid, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Sale {
    id: number;
    region: string;
    country: string;
    rep: string;
    deals: number;
    revenue: number;
    margin: number;
}

const places: [string, string][] = [
    ['Europe', 'Portugal'],
    ['Europe', 'Spain'],
    ['Europe', 'Germany'],
    ['Americas', 'Brazil'],
    ['Americas', 'Mexico'],
    ['Asia Pacific', 'Japan'],
    ['Asia Pacific', 'Australia']
];
const reps = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Ferreira', 'Elisa Rocha', 'Fábio Nunes', 'Gabriela Dias', 'Hugo Martins', 'Inês Alves'];

const sales = ref<Sale[]>(
    reps.flatMap((rep, r) =>
        [0, 1, 2].map((k) => {
            const [region, country] = places[(r * 2 + k * 3) % places.length]!;
            const deals = ((r * 7 + k * 5) % 12) + 3;
            return { id: r * 3 + k + 1, region, country, rep, deals, revenue: deals * (900 + ((r * 13 + k * 29) % 600)), margin: 0.12 + (((r + k) * 7) % 20) / 100 };
        })
    )
);

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
const percent = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'percent', maximumFractionDigits: 1 }));
const grid = ref<InstanceType<typeof DataGrid> | null>(null);
</script>

<template>
    <DataGrid ref="grid" :value="sales" data-key="id" aria-label="Sales by region" :group-by="['region', 'country']" sort-field="revenue" :sort-order="-1" status-bar class="demo-table">
        <template #header>
            <div class="demo-table-bar">
                <strong>Sales by region and country</strong>
                <Button size="small" severity="secondary" variant="outlined" :icon="chevronsUpDown" label="Expand all" class="demo-end" @click="grid?.expandAll()" />
                <Button size="small" severity="secondary" variant="outlined" :icon="chevronsDownUp" label="Collapse all" @click="grid?.collapseAll()" />
            </div>
        </template>
        <Column field="rep" header="Rep" sortable />
        <Column field="deals" header="Deals" sortable align="right" aggregate="sum" />
        <Column field="revenue" header="Revenue" sortable align="right" aggregate="sum">
            <template #body="{ data }">{{ money.format(data.revenue) }}</template>
            <template #aggregate="{ value }">{{ money.format(value as number) }}</template>
        </Column>
        <Column field="margin" header="Average margin" sortable align="right" aggregate="avg">
            <template #body="{ data }">{{ percent.format(data.margin) }}</template>
            <template #aggregate="{ value }">{{ percent.format(value as number) }}</template>
        </Column>
    </DataGrid>
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
</style>
