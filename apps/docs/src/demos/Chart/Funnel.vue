<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const signups: ChartSeries = [{ name: 'Signups', data: [4820, 3100, 1740, 980, 610] }];
const funnelOptions: ChartOptions = {
    ...quiet,
    labels: ['Visited', 'Signed up', 'Activated', 'Subscribed', 'Renewed'],
    plotOptions: { funnel: { neck: '30%', gap: 4 } },
    dataLabels: { enabled: true, formatter: '{seriesName}: {value|compact} ({percent|percent:0})' }
};
</script>

<template>
    <Chart type="funnel" :series="signups" :options="funnelOptions" height="320" style="width: 100%" />
</template>
