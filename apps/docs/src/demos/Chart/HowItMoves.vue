<script setup lang="ts">
import { Button, Chart, type ChartOptions, type ChartSeries, StackPanel } from '@vitral/vue';
import { computed, ref } from 'vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const sales: ChartSeries = [
    { name: 'Europe', data: [44, 55, 41, 67] },
    { name: 'Americas', data: [13, 23, 20, 8] }
];

const easings = ['linear', 'easein', 'easeout', 'easeinout'] as const;
const easing = ref<(typeof easings)[number]>('easeout');
const gradually = ref(true);
const replay = ref(0);
const animationOptions = computed<ChartOptions>(() => ({
    ...quiet,
    xaxis: { categories: quarters },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    legend: { position: 'top', horizontalAlign: 'left' },
    chart: { ...quiet.chart, animations: { enabled: true, speed: 900, easing: easing.value, animateGradually: { enabled: gradually.value, delay: 220 } } }
}));
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem">
            <div style="display: flex; gap: 0.5rem" role="group" aria-label="Easing">
                <Button v-for="e in easings" :key="e" size="small" severity="secondary" variant="outlined" :aria-pressed="easing === e" @click="((easing = e), replay++)">{{ e }}</Button>
            </div>
            <Button size="small" severity="secondary" variant="outlined" :aria-pressed="gradually" @click="((gradually = !gradually), replay++)">one at a time</Button>
            <Button size="small" severity="secondary" variant="outlined" @click="replay++">replay</Button>
        </div>
        <Chart :key="replay" type="bar" :series="sales" :options="animationOptions" height="240" style="width: 100%" />
    </StackPanel>
</template>
