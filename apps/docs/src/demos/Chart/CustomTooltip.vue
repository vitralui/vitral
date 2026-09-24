<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const visitors: ChartSeries = [{ name: 'Visitors', data: [310, 402, 385, 520, 610, 580, 720, 690, 810, 760, 905, 980] }];
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
        <Chart type="line" :series="visitors" :options="{ xaxis: { categories: months }, ...quiet, chart: { ...quiet.chart, accessibility: { dataTable: true } } }" height="240">
            <template #tooltip="{ title, rows }">
                <strong>{{ title }}</strong>
                <span>{{ rows[0]?.value }} visitors</span>
            </template>
        </Chart>
        <Chart type="bar" :series="[]" height="240" />
    </div>
</template>
