<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// A year of daily activity, from a fixed seed so the page is the same twice.
const daily = seeded(23);
const commits: ChartSeries = [
    {
        name: 'Commits',
        data: Array.from({ length: 365 }, (_, i) => {
            const date = new Date(2026, 0, 1 + i);
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            const value = Math.round(daily() * (weekend ? 4 : 14) * (daily() > 0.18 ? 1 : 0));
            return { x: date.getTime(), y: value };
        }).filter((d) => d.y > 0)
    }
];
const calendarOptions: ChartOptions = { ...quiet, plotOptions: { calendar: { weekStart: 1 } }, colors: ['var(--vt-chart-3)'], tooltip: { y: { formatter: '{value} commits' } } };
</script>

<template>
    <Chart type="calendar" :series="commits" :options="calendarOptions" height="200" style="width: 100%" />
</template>
