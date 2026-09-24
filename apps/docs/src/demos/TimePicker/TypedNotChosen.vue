<script setup lang="ts">
import { formatMinutes } from '@vitral/core';
import { StackPanel, TimePicker } from '@vitral/vue';
import { ref } from 'vue';

const typed = ref<number | null>(null);
const show = (minutes: number | null) => (minutes === null ? 'nothing' : formatMinutes(minutes, { hour12: false }));
</script>

<template>
    <StackPanel spacing="1rem">
        <TimePicker v-model="typed" placeholder="Type a time" aria-label="Any time" />
        <small style="color: var(--vt-text-muted-color)">Reads as {{ show(typed) }}</small>
    </StackPanel>
</template>
