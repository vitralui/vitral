<script setup lang="ts">
import { StackPanel, TimePicker } from '@vitral/vue';
import { computed, ref } from 'vue';

const start = ref<number | null>(540);
const nights = computed(() => (start.value === null ? '' : `${start.value} minutes past midnight`));
</script>

<template>
    <StackPanel spacing="1rem">
        <TimePicker v-model="start" aria-label="Start time" />
        <small style="color: var(--vt-text-muted-color)">{{ nights }}</small>
    </StackPanel>
</template>
