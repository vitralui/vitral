<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const sales: ChartSeries = [
    { name: 'Orders', type: 'bar', data: [120, 132, 101, 154, 190, 170, 210, 198, 240, 226, 270, 301], trendline: true },
    // A trend's own colour can also be given right here, beside its kind.
    { name: 'Returns', type: 'line', data: [14, 18, 12, 21, 17, 25, 19, 28, 22, 30, 26, 33], trendline: { type: 'movingAverage', period: 3, dashArray: 0, width: 3, color: '#7c3aed' } }
];
const options: ChartOptions = {
    chart: { toolbar: { show: false } },
    // One colour a line, in order: the two series, then the trends after them.
    colors: ['#38bdf8', '#f43f5e', '#f59e0b'],
    xaxis: { categories: months },
    yaxis: [{ seriesName: ['Orders', 'Orders trend'] }, { seriesName: ['Returns', 'Returns trend'], opposite: true }],
    legend: { position: 'top', horizontalAlign: 'left' }
};
</script>

<template>
    <Chart :series="sales" :options="options" height="280" style="width: 100%" />
</template>
