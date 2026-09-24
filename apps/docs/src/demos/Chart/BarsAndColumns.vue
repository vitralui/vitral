<script setup lang="ts">
import { Button, Chart, type ChartOptions, type ChartSeries, StackPanel } from '@vitral/vue';
import { computed, ref } from 'vue';

const barKinds = ['grouped', 'stacked', '100%', 'horizontal'] as const;
const barKind = ref<(typeof barKinds)[number]>('grouped');
const regions: ChartSeries = [
    { name: 'North', data: [44, 55, 41, 67] },
    { name: 'South', data: [13, 23, 20, 8] },
    { name: 'East', data: [11, 17, 15, 15] }
];
const barOptions = computed<ChartOptions>(() => ({
    chart: { stacked: barKind.value === 'stacked' || barKind.value === '100%', stackType: barKind.value === '100%' ? '100%' : 'normal' },
    plotOptions: {
        bar: {
            horizontal: barKind.value === 'horizontal',
            borderRadius: 5,
            borderRadiusWhenStacked: 'last',
            columnWidth: '60%',
            dataLabels: { total: { enabled: barKind.value === 'stacked' } }
        }
    },
    dataLabels: { enabled: barKind.value !== 'grouped', formatter: '{value}' },
    xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
    yaxis: { labels: { formatter: barKind.value === '100%' ? '{value|percent}' : '{value}' } },
    legend: { position: 'top', horizontalAlign: 'right' }
}));
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <div style="display: flex; gap: 0.5rem" role="group" aria-label="Layout">
            <Button v-for="k in barKinds" :key="k" size="small" severity="secondary" variant="outlined" :aria-pressed="barKind === k" @click="barKind = k">{{ k }}</Button>
        </div>
        <Chart type="bar" :series="regions" :options="barOptions" style="width: 100%" />
    </StackPanel>
</template>
