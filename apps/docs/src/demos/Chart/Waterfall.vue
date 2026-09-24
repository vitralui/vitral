<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const cash: ChartSeries = [{ name: 'Cash', data: [1200, 420, -180, 310, -260, 140, null] }];
const cashOptions: ChartOptions = {
    ...quiet,
    xaxis: { categories: ['Opening', 'Sales', 'Refunds', 'Services', 'Costs', 'Other', 'Closing'] },
    // The last column is a total: it is drawn from zero to the running sum
    // rather than as another step.
    plotOptions: { waterfall: { totals: [6] } },
    yaxis: { labels: { formatter: '{value|compact}' } },
    dataLabels: { enabled: true, formatter: '{value|compact}' }
};
</script>

<template>
    <Chart type="waterfall" :series="cash" :options="cashOptions" height="300" style="width: 100%" />
</template>
