<script setup lang="ts">
import { Chart, Tag, type ChartOptions, type ChartSeries } from '@vitral/vue';
import { computed, ref } from 'vue';

const editable = ref(
    JSON.stringify(
        {
            chart: { type: 'bar', height: 260 },
            xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
            yaxis: { labels: { formatter: '{value|compact}' } },
            plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', distributed: true } },
            dataLabels: { enabled: true, formatter: '{value|compact}', style: { color: '#ffffff' } },
            legend: { show: false },
            responsive: [{ breakpoint: 520, options: { plotOptions: { bar: { horizontal: true } } } }]
        },
        null,
        2
    )
);
const parsed = computed<{ options?: ChartOptions; error?: string }>(() => {
    try {
        return { options: JSON.parse(editable.value) };
    } catch (error) {
        return { error: (error as Error).message };
    }
});
const jsonSeries: ChartSeries = [{ name: 'Orders', data: [12400, 18300, 9800, 21000, 16700] }];
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; width: 100%">
        <textarea v-model="editable" aria-label="Chart options as JSON" spellcheck="false" rows="18" style="font-family: var(--vt-font-family-mono); font-size: 0.75rem; padding: 0.5rem; border-radius: var(--vt-content-border-radius); border: 1px solid var(--vt-content-border-color); background: var(--vt-content-background); color: var(--vt-text-color)" />
        <div>
            <Chart v-if="parsed.options" :series="jsonSeries" :options="parsed.options" />
            <Tag v-else severity="danger" :value="parsed.error" />
        </div>
    </div>
</template>
