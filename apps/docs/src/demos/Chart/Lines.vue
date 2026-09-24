<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const traffic: ChartSeries = [
    { name: 'Visitors', data: [310, 402, 385, 520, 610, 580, 720, 690, 810, 760, 905, 980] },
    { name: 'Sign-ups', data: [42, 51, 48, 66, 80, 71, 95, 88, 110, 102, 126, 140] }
];
const lineOptions: ChartOptions = {
    xaxis: { categories: months },
    yaxis: [{ title: { text: 'Visitors' } }, { opposite: true, title: { text: 'Sign-ups' } }],
    stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
    markers: { size: [0, 4] },
    title: { text: 'Visitors and sign-ups', align: 'left' },
    subtitle: { text: 'Two axes, one per series' }
};
</script>

<template>
    <Chart type="line" :series="traffic" :options="lineOptions" style="width: 100%" />
</template>
