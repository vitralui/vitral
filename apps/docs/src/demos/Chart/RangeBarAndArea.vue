<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const shifts: ChartSeries = [{ name: 'On call', data: [{ x: 'Ana', y: [8, 16] }, { x: 'Bruno', y: [12, 20] }, { x: 'Célia', y: [16, 24] }, { x: 'Dan', y: [0, 8] }] }];
const shiftOptions: ChartOptions = {
    ...quiet,
    plotOptions: { bar: { horizontal: true } },
    // Turned on its side the value axis is the y one, so the title goes there.
    yaxis: { title: { text: 'Hour of the day' } },
    tooltip: { y: { formatter: '{value}:00' } }
};

const forecast: ChartSeries = [
    { name: 'Likely range', type: 'rangeArea', data: months.map((x, i) => ({ x, y: [40 + i * 4, 78 + i * 7] as [number, number] })) },
    { name: 'Forecast', type: 'line', data: months.map((_, i) => 59 + i * 5.5) }
];
const forecastOptions: ChartOptions = { ...quiet, xaxis: { categories: months }, stroke: { curve: 'smooth', width: [1, 3] }, yaxis: { title: { text: 'Orders' } } };
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="rangeBar" :series="shifts" :options="shiftOptions" height="280" />
        <Chart type="rangeArea" :series="forecast" :options="forecastOptions" height="280" />
    </div>
</template>
