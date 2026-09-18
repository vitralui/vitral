<script setup lang="ts">
import { calendarClock, video } from '@vitral/icons';
import { Button, Icon, Schedule, Tag, type ScheduleEvent, type ScheduleViewName } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const monday = -((today.getDay() + 6) % 7);
const at = (day: number, hour: number, minute = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + day, hour, minute);

const events = ref<ScheduleEvent[]>([
    { id: 'c1', title: 'Live class · Interface design', start: at(monday + 1, 10), end: at(monday + 1, 11, 30), recurrence: 'FREQ=WEEKLY;BYDAY=TU,TH', color: 'var(--vt-chart-1)' },
    { id: 'c2', title: 'Listening session', start: at(monday, 18), end: at(monday, 18, 45), recurrence: 'FREQ=WEEKLY;BYDAY=MO,WE,FR', color: 'var(--vt-chart-2)' },
    { id: 'c3', title: 'Photo walk', start: at(monday + 5, 9), end: at(monday + 5, 11), color: 'var(--vt-chart-3)' },
    { id: 'c4', title: 'Office hours · Dr. Okoye', start: at(monday + 2, 14), end: at(monday + 2, 15), color: 'var(--vt-chart-4)' },
    { id: 'd1', title: 'Due: settings screen project', start: at(2, 0), allDay: true, color: 'var(--vt-chart-6)' },
    { id: 'd2', title: 'Due: portraits assignment', start: at(8, 0), allDay: true, color: 'var(--vt-chart-6)' },
    { id: 'c5', title: 'Study group', start: at(monday + 3, 16), end: at(monday + 3, 17, 30), color: 'var(--vt-chart-5)' }
]);

const view = ref<ScheduleViewName>('week');

const upcoming = [
    { title: 'Settings screen project', course: 'Interface design', when: 'in 2 days', severity: 'warn' as const },
    { title: 'Portraits assignment', course: 'Photography', when: 'in 8 days', severity: 'info' as const },
    { title: 'Live class', course: 'Interface design', when: 'Tuesday, 10:00', severity: 'secondary' as const }
];
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Calendar</h1>
            <p class="tp-muted">Live classes, practice and deadlines in one place.</p>
        </div>
        <Button label="Sync to my calendar" :icon="calendarClock" severity="secondary" variant="outlined" size="small" />
    </div>

    <ul class="tp-grid tp-upcoming" aria-label="Coming up">
        <li v-for="item in upcoming" :key="item.title" class="tp-card tp-stack">
            <Tag :value="item.when" :severity="item.severity" />
            <b>{{ item.title }}</b>
            <small class="tp-muted"><Icon :icon="video" /> {{ item.course }}</small>
        </li>
    </ul>

    <div class="tp-card tp-card-schedule">
        <Schedule
            v-model:view="view"
            :events="events"
            :views="['month', 'week', 'agenda']"
            min-time="08:00"
            max-time="20:00"
            scroll-time="09:00"
            :first-day-of-week="1"
            scroll-height="30rem"
            class="tp-schedule"
        />
    </div>
</template>
