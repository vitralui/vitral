<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const traffic: ChartSeries = [
    { name: 'Visitors', data: [310, 402, 385, 520, 610, 580, 720, 690, 810, 760, 905, 980] },
    { name: 'Sign-ups', data: [42, 51, 48, 66, 80, 71, 95, 88, 110, 102, 126, 140] }
];
const legendValueOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: months },
    stroke: { curve: 'smooth', width: 2 },
    legend: { position: 'top', horizontalAlign: 'left', value: { show: true, source: 'last', formatter: '{value}' } }
};
</script>

<template>
    <Chart type="line" :series="traffic" :options="legendValueOptions" height="260" style="width: 100%" />
</template>
