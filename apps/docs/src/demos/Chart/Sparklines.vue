<script setup lang="ts">
import { Chart, type ChartOptions } from '@vitral/vue';

const kpis = [
    { label: 'Revenue', value: '$48.2K', type: 'area' as const, data: [12, 14, 13, 17, 19, 18, 22, 24, 23, 27], color: 'var(--vt-chart-3)' },
    { label: 'Churn', value: '2.4%', type: 'line' as const, data: [3.1, 3.0, 2.9, 3.2, 2.8, 2.7, 2.6, 2.5, 2.5, 2.4], color: 'var(--vt-chart-6)' },
    { label: 'Deploys', value: '126', type: 'bar' as const, data: [8, 12, 9, 14, 11, 16, 13, 15, 12, 18], color: 'var(--vt-chart-4)' }
];
const spark = (color: string): ChartOptions => ({ chart: { sparkline: { enabled: true }, height: 48 }, colors: [color], stroke: { width: 2 }, tooltip: { x: { show: false } } });
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; width: 100%">
        <div v-for="k in kpis" :key="k.label" style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem; border: 1px solid var(--vt-content-border-color); border-radius: var(--vt-content-border-radius)">
            <small style="color: var(--vt-text-muted-color)">{{ k.label }}</small>
            <strong style="font-size: 1.25rem">{{ k.value }}</strong>
            <Chart :type="k.type" :series="[{ name: k.label, data: k.data }]" :options="spark(k.color)" />
        </div>
    </div>
</template>
