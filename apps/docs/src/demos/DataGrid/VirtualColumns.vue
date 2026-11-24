<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';

// A year of daily readings from two thousand sensors: 365 columns by 2,000 rows,
// of which the grid draws the few dozen cells in view.
const days = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 0, 1 + i));
    return { key: `d${i}`, label: `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}` };
});

interface Sensor {
    id: number;
    name: string;
    readings: number[];
    mean: number;
}

let seed = 3;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const sensors: Sensor[] = Array.from({ length: 2000 }, (_, i) => {
    let level = 20 + random() * 60;
    const readings = days.map(() => (level = Math.max(0, Math.min(100, level + (random() - 0.5) * 12))));
    return { id: i + 1, name: `Sensor ${String(i + 1).padStart(4, '0')}`, readings, mean: readings.reduce((sum, value) => sum + value, 0) / readings.length };
});

const heat = (value: number) => ({ background: `color-mix(in srgb, var(--vt-primary-color) ${Math.round(value * 0.6)}%, transparent)` });
</script>

<template>
    <DataGrid :value="sensors" data-key="id" aria-label="Daily readings" virtual-scroll virtual-columns :row-height="30" scroll-height="400px" size="small" show-gridlines class="demo-table">
        <Column field="name" header="Sensor" pinned="left" :width="120" sortable />
        <Column v-for="(day, i) in days" :key="day.key" :column-key="day.key" :header="day.label" :width="64" align="right" :export-value="(row: Sensor) => row.readings[i]">
            <template #body="{ data }">
                <span class="demo-heat" :style="heat(data.readings[i])">{{ Math.round(data.readings[i]) }}</span>
            </template>
        </Column>
        <Column field="mean" header="Mean" pinned="right" :width="80" align="right" sortable>
            <template #body="{ data }">
                <strong>{{ data.mean.toFixed(1) }}</strong>
            </template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-heat {
    display: block;
    margin: -0.25rem -0.5rem;
    padding: 0.25rem 0.5rem;
}
</style>
