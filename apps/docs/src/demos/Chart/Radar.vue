<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const skills: ChartSeries = [
    { name: 'Ana', data: [80, 50, 30, 40, 100, 20] },
    { name: 'Rui', data: [20, 30, 40, 80, 20, 80] }
];
const radarOptions = (grid: 'web' | 'polygon'): ChartOptions => ({
    ...quiet,
    xaxis: { categories: ['Design', 'Code', 'Ops', 'Data', 'Writing', 'Support'] },
    plotOptions: { radar: { grid } },
    fill: { opacity: grid === 'polygon' ? 0.35 : 0.15 },
    legend: { show: grid === 'web' }
});
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="radar" :series="skills" :options="radarOptions('web')" height="320" />
        <Chart type="radar" :series="[skills[0]!]" :options="radarOptions('polygon')" height="320" />
    </div>
</template>
