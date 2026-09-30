<script setup lang="ts">
import { DatePicker, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();

const born = ref<Date | null>(null);
const hired = ref<Date | null>(new Date(2019, 7, 12));
const archive = ref<Date | null>(new Date(2008, 4, 20));

const shown = (value: Date | null) => (value ? value.toDateString() : 'null');
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-born">Date of birth</Label>
            <DatePicker id="dp-born" v-model="born" :max-date="today" placeholder="Pick a date" aria-describedby="dp-born-hint" />
            <small id="dp-born-hint" style="color: var(--vt-text-muted-color)">Press the year, then the month · value: {{ shown(born) }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-hired">Hired, between 2015 and 2030</Label>
            <DatePicker id="dp-hired" v-model="hired" :min-date="new Date(2015, 2, 1)" :max-date="new Date(2030, 9, 31)" aria-describedby="dp-hired-hint" />
            <small id="dp-hired-hint" style="color: var(--vt-text-muted-color)">Months and years out of range cannot be chosen</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <span id="dp-archive-label">Inline</span>
            <DatePicker v-model="archive" inline aria-labelledby="dp-archive-label" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ shown(archive) }}</small>
        </StackPanel>
    </StackPanel>
</template>
