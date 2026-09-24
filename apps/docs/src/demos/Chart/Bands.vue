<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const visitors: ChartSeries = [{ name: 'Visitors', data: [310, 402, 385, 520, 610, 580, 720, 690, 810, 760, 905, 980] }];
const bandedOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: months },
    stroke: { curve: 'smooth', width: 3 },
    legend: { show: false },
    annotations: {
        position: 'back',
        yaxis: [
            { y: 200, y2: 400, fillColor: 'var(--vt-chart-3)', opacity: 0.1, label: { text: 'Quiet', position: 'left' } },
            { y: 700, y2: 1000, fillColor: 'var(--vt-chart-6)', opacity: 0.1, label: { text: 'Busy', position: 'left' } }
        ],
        xaxis: [{ x: 'Jul', x2: 'Sep', fillColor: 'var(--vt-chart-5)', opacity: 0.12, label: { text: 'Campaign' } }]
    }
};
</script>

<template>
    <Chart type="line" :series="visitors" :options="bandedOptions" height="260" style="width: 100%" />
</template>
