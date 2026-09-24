<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const against: ChartSeries = [
    {
        name: 'Against target',
        data: [
            { x: 'Revenue', y: 78, target: 90 },
            { x: 'Signups', y: 112, target: 100 },
            { x: 'Retention', y: 64, target: 75 },
            { x: 'Margin', y: 41, target: 50 }
        ]
    }
];
const bulletOptions: ChartOptions = {
    ...quiet,
    // The bands are the scale a bullet is read against: poor, fair, good.
    plotOptions: { bullet: { ranges: [{ from: 0, to: 130 }, { from: 0, to: 90 }, { from: 0, to: 55 }] } },
    tooltip: { y: { formatter: '{value}%' } }
};
</script>

<template>
    <Chart type="bullet" :series="against" :options="bulletOptions" height="260" style="width: 100%" />
</template>
