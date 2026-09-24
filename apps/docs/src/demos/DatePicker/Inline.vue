<script setup lang="ts">
import { DatePicker, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const plus = (days: number) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);

const inline = ref<Date | null>(plus(2));
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <span id="dp-inline-label">Pick-up day</span>
            <DatePicker v-model="inline" inline show-today-button show-clear-button aria-labelledby="dp-inline-label" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ inline ? inline.toDateString() : 'null' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <span id="dp-inline-disabled">Disabled</span>
            <DatePicker :model-value="plus(1)" inline disabled aria-labelledby="dp-inline-disabled" />
        </StackPanel>
    </StackPanel>
</template>
