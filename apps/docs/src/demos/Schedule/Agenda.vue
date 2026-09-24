<script setup lang="ts">
import { Schedule, type ScheduleEvent } from '@vitral/vue';

const today = new Date();
const at = (dayOffset: number, hour: number, minute = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);
const day = (dayOffset: number) => at(dayOffset, 0);

const events: ScheduleEvent[] = [
    { id: 1, title: 'Standup', start: at(-today.getDay() + 1, 9), end: at(-today.getDay() + 1, 9, 15), recurrence: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', color: 'var(--vt-chart-4)' },
    { id: 2, title: 'Design review', start: at(0, 10), end: at(0, 11, 30) },
    { id: 3, title: 'Pairing', start: at(0, 10, 30), end: at(0, 12) },
    { id: 4, title: 'Lunch with Ana', start: at(1, 12, 30), end: at(1, 13, 30), color: 'var(--vt-chart-3)' },
    { id: 5, title: 'Release', start: day(2), end: day(4), allDay: true, color: 'var(--vt-chart-2)' },
    { id: 6, title: 'Planning', start: at(-1, 14), end: at(-1, 16) },
    { id: 7, title: 'Board meeting', start: at(3, 15), end: at(3, 16), editable: false, color: 'var(--vt-chart-6)' },
    { id: 8, title: 'Payroll', start: new Date(today.getFullYear(), today.getMonth(), 1, 8), recurrence: 'FREQ=MONTHLY;BYMONTHDAY=1,-1', allDay: true, color: 'var(--vt-chart-5)' }
];
</script>

<template>
    <Schedule view="agenda" :views="['agenda']" :agenda-days="14" :events="events" style="width: 100%" />
</template>
