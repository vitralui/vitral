<script setup lang="ts">
import { IconField, InputIcon, InputText, Schedule, ToggleButton, type ScheduleEvent } from '@vitral/vue';
import { computed, ref } from 'vue';

const today = new Date();
const at = (dayOffset: number, hour: number, minute = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);

const events: ScheduleEvent[] = [
    { id: 1, title: 'Standup', start: at(0, 9), end: at(0, 9, 15), location: 'Room A' },
    { id: 2, title: 'Design review', start: at(0, 10), end: at(0, 11, 30), location: 'Room B', description: 'Tokens and the new tabs' },
    { id: 3, title: 'Reunião com a Ana', start: at(1, 12, 30), end: at(1, 13, 30), location: 'Café', color: 'var(--vt-chart-3)' },
    { id: 4, title: 'Release', start: at(2, 15), end: at(2, 16), color: 'var(--vt-chart-2)', mine: true },
    { id: 5, title: 'Planning', start: at(-1, 14), end: at(-1, 16), location: 'Room A', mine: true },
    { id: 6, title: 'Interview', start: at(1, 16), end: at(1, 17), location: 'Room B', mine: true }
];

const search = ref('');
const mineOnly = ref(false);
// Words find events by title, description and location; a function decides anything else.
const filter = computed(() => (mineOnly.value ? (event: ScheduleEvent) => !!event.mine && (!search.value || String(event.title).toLowerCase().includes(search.value.toLowerCase())) : search.value));
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem">
        <IconField>
            <InputIcon icon="search" />
            <InputText v-model="search" placeholder="Title, place or notes" aria-label="Search events" />
        </IconField>
        <ToggleButton v-model="mineOnly" on-label="Only mine" off-label="Only mine" />
    </div>
    <Schedule :events="events" :filter="filter" view="week" :views="['week', 'agenda']" scroll-time="08:30" scroll-height="24rem" aria-label="Filtered calendar" style="width: 100%" />
</template>
