<script setup lang="ts">
import { Button, Chart, type ChartKind, type ChartOptions, type ChartSeries, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const budget: ChartSeries = [1200, 450, 380, 290, 160];
const pieKind = ref<ChartKind>('donut');
const pieOptions: ChartOptions = {
    labels: ['Housing', 'Food', 'Transport', 'Leisure', 'Other'],
    plotOptions: { pie: { donut: { labels: { total: { label: 'Monthly', formatter: '{value|currency:EUR}' }, value: { formatter: '{value|currency:EUR}' } } } } },
    tooltip: { y: { formatter: '{value|currency:EUR}' } }
};
const picked = ref('Click or press Enter on a slice.');
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <div style="display: flex; gap: 0.5rem" role="group" aria-label="Kind">
            <Button v-for="k in ['donut', 'pie'] as const" :key="k" size="small" severity="secondary" variant="outlined" :aria-pressed="pieKind === k" @click="pieKind = k">{{ k }}</Button>
        </div>
        <Chart :type="pieKind" :series="budget" :options="pieOptions" height="300" @data-point-selection="(e) => (picked = `${pieOptions.labels![e.seriesIndex]}: ${e.selected ? 'selected' : 'released'}`)" />
        <small style="color: var(--vt-text-muted-color)">{{ picked }}</small>
    </StackPanel>
</template>
