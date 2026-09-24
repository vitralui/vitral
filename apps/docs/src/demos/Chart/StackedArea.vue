<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const requests: ChartSeries = [
    { name: 'API', data: [1200, 1500, 1400, 1800, 2100, 1900, 2400, 2600, 2500, 2900, 3100, 3300] },
    { name: 'Web', data: [800, 900, 1100, 1000, 1300, 1500, 1400, 1600, 1800, 1700, 2000, 2200] },
    { name: 'Jobs', data: [300, 280, 350, 400, 380, 420, 460, 500, 480, 530, 560, 600] }
];
const areaOptions: ChartOptions = {
    chart: { stacked: true },
    xaxis: { categories: months },
    yaxis: { labels: { formatter: '{value|compact}' } },
    stroke: { curve: 'monotoneCubic', width: 2 },
    tooltip: { y: { formatter: '{value|integer} requests' } }
};
</script>

<template>
    <Chart type="area" :series="requests" :options="areaOptions" style="width: 100%" />
</template>
