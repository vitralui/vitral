<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries, StackPanel } from '@vitral/vue';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const start = new Date(2026, 5, 1).getTime();
const readings = seeded(5);
let level = 50;
const series1 = Array.from({ length: 240 }, (_, i) => [start + i * 3600000, (level = Math.max(5, Math.round(level + (readings() - 0.5) * 8)))] as [number, number]);
const sensor: ChartSeries = [{ name: 'Temperature', data: series1 }];
const targetOptions: ChartOptions = { chart: { id: 'sensor', height: 240, toolbar: { tools: { download: true } } }, xaxis: { type: 'datetime' }, stroke: { width: 2, curve: 'straight' }, yaxis: { labels: { formatter: '{value} °C' } }, legend: { show: false } };
const brushOptions: ChartOptions = {
    chart: { height: 110, brush: { enabled: true, target: 'sensor' }, selection: { enabled: true, xaxis: { min: series1[60]![0], max: series1[120]![0] } } },
    xaxis: { type: 'datetime' },
    yaxis: { show: false },
    colors: ['var(--vt-chart-4)'],
    legend: { show: false },
    tooltip: { enabled: false }
};
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Chart type="line" :series="sensor" :options="targetOptions" />
        <Chart type="area" :series="sensor" :options="brushOptions" />
    </StackPanel>
</template>
