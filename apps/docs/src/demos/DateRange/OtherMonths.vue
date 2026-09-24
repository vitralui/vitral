<script setup lang="ts">
import { DateRange, type DateRangeValue } from '@vitral/vue';
import { ref } from 'vue';

const at = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
};

const inline = ref<DateRangeValue>({ start: at(1), end: at(5) });
</script>

<template>
    <DateRange v-model="inline" inline show-other-months aria-label="Dates, edges drawn" />
</template>
