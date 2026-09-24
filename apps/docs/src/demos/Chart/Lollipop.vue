<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const lollipop: ChartSeries = [{ name: 'Rating', data: [4.6, 4.4, 4.1, 3.9, 3.8, 3.6, 3.4, 3.2] }];
const lollipopOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: ['Lisboa', 'Porto', 'Braga', 'Faro', 'Coimbra', 'Aveiro', 'Évora', 'Leiria'] },
    plotOptions: { bar: { horizontal: true }, lollipop: { markerSize: 12, stemWidth: 2 } },
    dataLabels: { enabled: true, formatter: '{value|fixed:1}', style: { color: 'var(--vt-text-color)' } },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } }
};
</script>

<template>
    <Chart type="lollipop" :series="lollipop" :options="lollipopOptions" style="width: 100%" />
</template>
