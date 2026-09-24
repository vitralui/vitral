<script setup lang="ts">
import { Button, Chart, type ChartOptions, type ChartSeries, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
let reading = 0;
const quarterly = [
    [
        { name: 'Europe', data: [44, 55, 41, 67] },
        { name: 'Americas', data: [13, 23, 20, 8] }
    ],
    [
        { name: 'Europe', data: [61, 38, 72, 49] },
        { name: 'Americas', data: [28, 45, 12, 33] }
    ],
    [
        { name: 'Europe', data: [30, 70, 55, 35] },
        { name: 'Americas', data: [40, 18, 38, 22] }
    ]
] satisfies ChartSeries[];
const moving = ref<ChartSeries>(quarterly[0]!);
const nextReading = () => {
    reading = (reading + 1) % quarterly.length;
    moving.value = quarterly[reading]!;
};
const movingOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: quarters },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    legend: { position: 'top', horizontalAlign: 'left', value: { show: true } }
};
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <div><Button size="small" severity="secondary" variant="outlined" @click="nextReading">New numbers</Button></div>
        <Chart type="bar" :series="moving" :options="movingOptions" height="260" style="width: 100%" />
    </StackPanel>
</template>
