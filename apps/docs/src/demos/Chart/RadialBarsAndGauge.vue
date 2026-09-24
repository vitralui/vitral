<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const usage: ChartSeries = [
    { name: 'Storage', data: [72] },
    { name: 'Memory', data: [48] },
    { name: 'CPU', data: [35] }
];
const radialOptions: ChartOptions = { ...quiet, legend: { show: true, position: 'bottom' } };
const gaugeOptions: ChartOptions = { ...quiet, colors: ['var(--vt-chart-3)'], plotOptions: { radialBar: { min: 90, max: 100 } }, dataLabels: { formatter: '{value}%' } };
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="radialBar" :series="usage" :options="radialOptions" height="300" />
        <Chart type="gauge" :series="[{ name: 'Uptime', data: [99.4] }]" :options="gaugeOptions" height="300" />
    </div>
</template>
