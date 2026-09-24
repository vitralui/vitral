<script setup lang="ts">
import { Button, Schedule, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

// ---- the same instants, read in three places
const zones = ['UTC', 'America/Sao_Paulo', 'Asia/Tokyo'] as const;
const zone = ref<(typeof zones)[number]>('America/Sao_Paulo');
const handoverDay = new Date(2026, 2, 9);
const handovers = [
    { id: 'h1', title: 'Handover', start: new Date(Date.UTC(2026, 2, 9, 15, 0)), end: new Date(Date.UTC(2026, 2, 9, 16, 0)) },
    { id: 'h2', title: 'Market open', start: new Date(Date.UTC(2026, 2, 9, 13, 30)), end: new Date(Date.UTC(2026, 2, 9, 14, 0)) },
    { id: 'h3', title: 'Nightly build', start: new Date(Date.UTC(2026, 2, 9, 2, 0)), end: new Date(Date.UTC(2026, 2, 9, 3, 0)) }
];
const readBack = ref('');
const showInstant = (change: { occurrence: { start: Date } }) => (readBack.value = change.occurrence.start.toISOString());
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem">
            <div style="display: flex; gap: 0.5rem" role="group" aria-label="Time zone">
                <Button v-for="z in zones" :key="z" size="small" severity="secondary" variant="outlined" :aria-pressed="zone === z" @click="zone = z">{{ z }}</Button>
            </div>
            <small v-if="readBack" style="color: var(--vt-text-muted-color)">Reported as {{ readBack }}</small>
        </div>
        <Schedule :events="handovers" :date="handoverDay" view="day" :views="['day']" :time-zone="zone" scroll-time="00:00" aria-label="Handovers" @event-click="showInstant" />
    </StackPanel>
</template>
