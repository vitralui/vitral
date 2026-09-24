<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;
// A seeded random, so the page draws the same data twice.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const random = seeded(7);
const scatter: ChartSeries = ['Team A', 'Team B'].map((name, t) => ({
    name,
    data: Array.from({ length: 28 }, () => [Math.round((20 + random() * 60 + t * 12) * 10) / 10, Math.round((30 + random() * 40 + t * 15) * 10) / 10] as [number, number])
}));
const scatterOptions: ChartOptions = {
    xaxis: { title: { text: 'Hours of practice' } },
    yaxis: { title: { text: 'Score' } },
    markers: { shape: ['circle', 'diamond'], size: 8 },
    annotations: { yaxis: [{ y: 70, label: { text: 'Pass mark' } }] }
};

const bubbles: ChartSeries = [
    { name: 'Europe', data: [{ x: 12, y: 60, z: 450 }, { x: 25, y: 72, z: 83 }, { x: 34, y: 55, z: 67 }] },
    { name: 'Americas', data: [{ x: 18, y: 40, z: 330 }, { x: 42, y: 65, z: 210 }, { x: 55, y: 48, z: 39 }] }
];
const bubbleOptions: ChartOptions = { ...quiet, xaxis: { title: { text: 'Growth %' } }, tooltip: { z: { title: 'Population (M)' } }, dataLabels: { enabled: true, formatter: '{value}' } };
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="scatter" :series="scatter" :options="scatterOptions" />
        <Chart type="bubble" :series="bubbles" :options="bubbleOptions" />
    </div>
</template>
