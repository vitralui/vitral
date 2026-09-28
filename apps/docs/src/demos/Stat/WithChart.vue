<script setup lang="ts">
import { Chart, Stat } from '@vitral/vue';

const visits = [{ name: 'Visits', data: [31, 40, 28, 51, 42, 60, 74, 68, 80, 95] }];
</script>

<template>
    <div style="width: min(100%, 18rem)">
        <Stat label="Visits today" :value="9512" :delta="0.18">
            <template #chart>
                <Chart type="area" :series="visits" :options="{ chart: { sparkline: { enabled: true } } }" height="3rem" aria-label="Visits over the last ten hours" />
            </template>
        </Stat>
    </div>
</template>
