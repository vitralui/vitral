<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const traffic: ChartSeries = ['Search', 'Direct', 'Social', 'Mail', 'Referral'].map((name, row) => ({
    name,
    data: months.map((_, i) => Math.round(30 + Math.sin((i + row * 2) / 1.7) * 18 + row * 6 + i * (row % 2 ? 1.5 : 3)))
}));
const streamOptions: ChartOptions = { ...quiet, xaxis: { categories: months }, tooltip: { shared: true } };
</script>

<template>
    <Chart type="stream" :series="traffic" :options="streamOptions" height="300" style="width: 100%" />
</template>
