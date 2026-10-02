<script setup lang="ts">
import { DateRange, Label, StackPanel, type DateRangeValue } from '@vitral/vue';
import { ref } from 'vue';

const stay = ref<DateRangeValue>({ start: null, end: null });
const write = (date: Date | null) => (date ? date.toLocaleString() : '—');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 20rem">
        <Label for="dr-times">Check-in and check-out</Label>
        <DateRange id="dr-times" v-model="stay" show-time :time-step="15" min-time="12:00" max-time="22:00" placeholder="Pick the dates and times" />
        <small style="color: var(--vt-text-muted-color)">From {{ write(stay.start) }} to {{ write(stay.end) }}</small>
    </StackPanel>
</template>
