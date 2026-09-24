<script setup lang="ts">
import { DateRange, type DateRangeValue, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const single = ref<DateRangeValue>({ start: null, end: null });
</script>

<template>
    <StackPanel spacing="0.375rem">
        <span id="dr-one">Dates</span>
        <DateRange v-model="single" :months="1" placeholder="Pick two dates" aria-labelledby="dr-one" />
        <small style="color: var(--vt-text-muted-color)">{{ single.start ? `${single.start.toLocaleDateString()} → ${single.end?.toLocaleDateString() ?? '…'}` : 'Empty' }}</small>
    </StackPanel>
</template>
