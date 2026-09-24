<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const sales: ChartSeries = [
    { name: 'Europe', data: [44, 55, 41, 67] },
    { name: 'Americas', data: [13, 23, 20, 8] }
];
const sharedTooltip: ChartOptions = { ...quiet, xaxis: { categories: quarters }, legend: { position: 'top', horizontalAlign: 'left' } };
const singleTooltip: ChartOptions = { ...sharedTooltip, tooltip: { shared: false, intersect: true } };
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="bar" :series="sales" :options="sharedTooltip" height="240" />
        <Chart type="bar" :series="sales" :options="singleTooltip" height="240" />
    </div>
</template>
