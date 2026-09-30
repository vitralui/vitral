<script setup lang="ts">
import { DateRange, type DateRangeValue, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const period = ref<DateRangeValue>({ start: new Date(2019, 2, 4), end: new Date(2019, 3, 18) });
const inline = ref<DateRangeValue>({ start: null, end: null });

const shown = (range: DateRangeValue) => (range.start && range.end ? `${range.start.toDateString()} – ${range.end.toDateString()}` : 'No range yet');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="1.5rem" align="start" wrap>
        <StackPanel spacing="0.375rem">
            <span id="dr-period">Report period, up to today</span>
            <DateRange v-model="period" :max-date="new Date()" aria-labelledby="dr-period" />
            <small style="color: var(--vt-text-muted-color)">Press a year, then a month · {{ shown(period) }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem">
            <span id="dr-month-year-inline">Inline</span>
            <DateRange v-model="inline" inline aria-labelledby="dr-month-year-inline" />
            <small style="color: var(--vt-text-muted-color)">{{ shown(inline) }}</small>
        </StackPanel>
    </StackPanel>
</template>
