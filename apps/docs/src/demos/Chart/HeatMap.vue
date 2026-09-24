<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;
// A seeded random, so the page draws the same data twice.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = ['06', '08', '10', '12', '14', '16', '18', '20', '22'];
const busy = seeded(3);
const heat: ChartSeries = days.map((d, di) => ({ name: d, data: hours.map((x, hi) => ({ x, y: Math.round((di > 4 ? 20 : 50) + Math.sin(hi / 2) * 30 + busy() * 20) })) }));
const heatOptions: ChartOptions = { ...quiet, colors: ['var(--vt-chart-1)'], plotOptions: { heatmap: { shadeSteps: 5, radius: 3 } }, tooltip: { y: { formatter: '{value} commits' } } };
</script>

<template>
    <Chart type="heatmap" :series="heat" :options="heatOptions" height="280" style="width: 100%" />
</template>
