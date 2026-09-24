<script setup lang="ts">
import { DatePicker, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const plus = (days: number) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);

const date = ref<Date | null>(null);
const iso = ref<Date | null>(plus(3));

const shown = (value: Date | null) => (value ? value.toDateString() : 'null');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-basic">Date</Label>
            <DatePicker id="dp-basic" v-model="date" placeholder="Pick a date" aria-describedby="dp-basic-hint" />
            <small id="dp-basic-hint" style="color: var(--vt-text-muted-color)">Format from the locale · value: {{ shown(date) }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-iso">ISO format, weeks from Monday</Label>
            <DatePicker id="dp-iso" v-model="iso" date-format="yyyy-MM-dd" :first-day-of-week="1" />
        </StackPanel>
    </StackPanel>
</template>
