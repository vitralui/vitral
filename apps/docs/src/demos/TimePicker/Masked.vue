<script setup lang="ts">
import { formatMinutes } from '@vitral/core';
import { Label, StackPanel, TimePicker } from '@vitral/vue';
import { ref } from 'vue';

const start = ref<number | null>(null);
const show = (minutes: number | null) => (minutes === null ? 'nothing' : formatMinutes(minutes, { hour12: false }));
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 12rem">
        <Label for="tp-masked">Shift starts</Label>
        <TimePicker id="tp-masked" v-model="start" :hour12="false" />
        <small style="color: var(--vt-text-muted-color)">Reads as {{ show(start) }}</small>
    </StackPanel>
</template>
