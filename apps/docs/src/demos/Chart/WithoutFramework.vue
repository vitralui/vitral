<script setup lang="ts">
// No framework here: `@vitral/chart` draws into any element, and the same
// options object the <Chart> component takes configures it.
import { createChart, type ChartHandle } from '@vitral/chart';
import { Button, StackPanel } from '@vitral/vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const host = ref<HTMLElement | null>(null);
const kinds = ['bar', 'line', 'area'] as const;
const kind = ref<(typeof kinds)[number]>('bar');
const pick = ref('Click a bar, or Tab to the plot and press Enter.');
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
let chart: ChartHandle | undefined;

onMounted(() => {
    chart = createChart(host.value!, {
        type: 'bar',
        series: [
            { name: 'Online', data: [42, 58, 51, 73] },
            { name: 'Stores', data: [35, 31, 38, 36] }
        ],
        options: {
            chart: { height: 260, toolbar: { show: false } },
            xaxis: { categories: quarters },
            yaxis: { labels: { formatter: '{value}k' } },
            plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
            legend: { position: 'top', horizontalAlign: 'right' }
        }
    });
    chart.on('dataPointSelection', ({ seriesIndex, dataPointIndex, value, selected }) => {
        const series = seriesIndex === 0 ? 'Online' : 'Stores';
        pick.value = selected ? `${series}, ${quarters[dataPointIndex]}: ${value}k` : 'Nothing selected';
    });
});
// And when the element goes away: chart.destroy();
onBeforeUnmount(() => chart?.destroy());

// Later: new inputs are compared by value, and only what changed is redrawn.
function pickKind(next: (typeof kinds)[number]) {
    kind.value = next;
    chart?.update({ type: next });
}
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <div style="display: flex; gap: 0.5rem" role="group" aria-label="Kind">
            <Button v-for="k in kinds" :key="k" size="small" severity="secondary" variant="outlined" :aria-pressed="kind === k" @click="pickKind(k)">{{ k }}</Button>
        </div>
        <div ref="host" />
        <small style="color: var(--vt-text-muted-color)">{{ pick }}</small>
    </StackPanel>
</template>
