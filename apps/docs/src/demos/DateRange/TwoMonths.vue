<script setup lang="ts">
import { DateRange, type DateRangeValue, StackPanel } from '@vitral/vue';
import { computed, ref } from 'vue';

const at = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
};

const stay = ref<DateRangeValue>({ start: at(3), end: at(9) });
const nights = computed(() => (stay.value.start && stay.value.end ? Math.round((stay.value.end.getTime() - stay.value.start.getTime()) / 86400000) : 0));
</script>

<template>
    <StackPanel spacing="0.375rem">
        <span id="dr-stay">Your stay</span>
        <DateRange v-model="stay" :min-date="at(0)" show-clear-button aria-labelledby="dr-stay" />
        <small style="color: var(--vt-text-muted-color)">{{ nights ? `${nights} night${nights === 1 ? '' : 's'}` : 'No dates yet' }}</small>
    </StackPanel>
</template>
