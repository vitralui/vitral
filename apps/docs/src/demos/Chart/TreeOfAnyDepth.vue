<script setup lang="ts">
import { Chart, type ChartOptions, type ChartSeries } from '@vitral/vue';

const quiet = { chart: { toolbar: { show: false } } } satisfies ChartOptions;

// A parent a point names builds a tree of any depth, rather than the two
// levels a list of series gives.
const roles: ChartSeries = [
    {
        name: 'Headcount',
        data: [
            { x: 'Engineering', y: 0 },
            { x: 'Product', y: 0 },
            { x: 'Platform', y: 18, parent: 'Engineering' },
            { x: 'Web', y: 14, parent: 'Engineering' },
            { x: 'Mobile', y: 9, parent: 'Engineering' },
            { x: 'Design', y: 7, parent: 'Product' },
            { x: 'Research', y: 4, parent: 'Product' },
            { x: 'iOS', y: 5, parent: 'Mobile' },
            { x: 'Android', y: 4, parent: 'Mobile' }
        ]
    }
];
</script>

<template>
    <Chart type="sunburst" :series="roles" :options="quiet" height="340" style="width: 100%" />
</template>
