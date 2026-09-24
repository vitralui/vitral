<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const regions: ChartSeries = [
    { name: 'Europe', data: [{ x: 'Germany', y: 84 }, { x: 'France', y: 68 }, { x: 'Spain', y: 47 }, { x: 'Portugal', y: 12 }] },
    { name: 'Americas', data: [{ x: 'United States', y: 132 }, { x: 'Brazil', y: 72 }, { x: 'Mexico', y: 39 }] },
    { name: 'Asia', data: [{ x: 'Japan', y: 61 }, { x: 'India', y: 55 }, { x: 'Singapore', y: 14 }] }
];
const treemapOptions: ChartOptions = { ...quiet, legend: { show: true, position: 'bottom' } };
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="treemap" :series="regions" :options="treemapOptions" height="300" />
        <Chart type="sunburst" :series="regions" :options="quiet" height="300" />
    </div>
</template>
