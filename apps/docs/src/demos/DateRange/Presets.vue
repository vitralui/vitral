<script setup lang="ts">
import { Button, DateRange, type DateRangeValue, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const at = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
};

const report = ref<DateRangeValue>({ start: at(-30), end: at(0) });

// A range picker is usually next to a few spans people ask for by name.
const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 }
];
const usePreset = (days: number) => (report.value = { start: at(-days + 1), end: at(0) });
</script>

<template>
    <DateRange v-model="report" :max-date="at(0)" aria-label="Reporting period">
        <template #footer="{ nights: n, clear }">
            <StackPanel orientation="horizontal" spacing="0.375rem" align="center" wrap as="span">
                <Button v-for="p in presets" :key="p.days" :label="p.label" severity="secondary" variant="text" size="small" @click="usePreset(p.days)" />
            </StackPanel>
            <small style="color: var(--vt-text-muted-color)">{{ n + 1 }} days · <a href="#" @click.prevent="clear">clear</a></small>
        </template>
    </DateRange>
</template>
