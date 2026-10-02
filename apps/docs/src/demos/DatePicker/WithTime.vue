<script setup lang="ts">
import { DatePicker, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const meeting = ref<Date | null>(null);
const shift = ref<Date | null>(null);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-meeting">Meeting</Label>
            <DatePicker id="dp-meeting" v-model="meeting" show-time placeholder="Pick a date and time" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ meeting ? meeting.toISOString() : '—' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-shift">Every quarter hour, 08:00 to 18:00</Label>
            <DatePicker id="dp-shift" v-model="shift" show-time :time-step="15" :hour12="false" min-time="08:00" max-time="18:00" show-clear-button placeholder="Pick a date and time" />
        </StackPanel>
    </StackPanel>
</template>
