<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;
// A seeded random, so the page draws the same data twice.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// Raw readings: the chart counts them into bins itself.
const noise = seeded(17);
const latencies = Array.from({ length: 400 }, () => Math.round(40 + Math.abs(noise() + noise() + noise() - 1.5) * 90));
const latencySeries: ChartSeries = [{ name: 'Response time', data: latencies }];
const latencyOptions: ChartOptions = {
    ...quiet,
    plotOptions: { histogram: { bins: 16 } },
    xaxis: { title: { text: 'Milliseconds' } },
    yaxis: { title: { text: 'Requests' } },
    colors: ['var(--vt-chart-5)']
};

const spread: ChartSeries = [
    {
        name: 'Response time',
        data: [
            { x: 'API', y: [12, 28, 41, 63, 140] as [number, number, number, number, number] },
            { x: 'Web', y: [30, 52, 68, 90, 180] as [number, number, number, number, number] },
            { x: 'Jobs', y: [8, 15, 22, 34, 70] as [number, number, number, number, number] },
            { x: 'Search', y: [18, 34, 49, 71, 155] as [number, number, number, number, number] }
        ]
    }
];
const spreadOptions: ChartOptions = { ...quiet, yaxis: { title: { text: 'Milliseconds' } }, colors: ['var(--vt-chart-2)'] };
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="histogram" :series="latencySeries" :options="latencyOptions" height="280" />
        <Chart type="boxPlot" :series="spread" :options="spreadOptions" height="280" />
    </div>
</template>
