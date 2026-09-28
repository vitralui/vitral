<script setup lang="ts">
import { Button, Schedule, type ScheduleEvent } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const at = (dayOffset: number, hour: number, minute = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);

const events: ScheduleEvent[] = [
    { id: 'standup', title: 'Standup', start: at(-today.getDay() + 1, 9), end: at(-today.getDay() + 1, 9, 15), recurrence: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', location: 'Room 2' },
    { id: 'review', title: 'Design review', start: at(1, 10), end: at(1, 11, 30), description: 'Bring the new empty states.' },
    { id: 'offsite', title: 'Offsite', start: at(3, 0), end: at(5, 0), allDay: true }
];
const schedule = ref<InstanceType<typeof Schedule> | null>(null);
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <Button label="Add to my calendar (.ics)" icon="download" size="small" style="align-self: flex-start" @click="schedule?.exportICS({ filename: 'team.ics', name: 'Team' })" />
        <Schedule ref="schedule" view="agenda" :views="['agenda']" :agenda-days="7" :events="events" style="width: 100%" />
    </div>
</template>
