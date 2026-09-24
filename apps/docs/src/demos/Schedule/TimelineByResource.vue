<script setup lang="ts">
import { Schedule, type ScheduleEvent, type ScheduleEventChange, type ScheduleViewName } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const at = (dayOffset: number, hour: number, minute = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);
const day = (dayOffset: number) => at(dayOffset, 0);

const view = ref<ScheduleViewName>('timeline');
const resources = [
    { id: 'a', title: 'Auditorium' },
    { id: 'b', title: 'Room B', color: 'var(--vt-chart-3)' },
    { id: 'c', title: 'Room C', color: 'var(--vt-chart-7)' },
    { id: 'd', title: 'Studio' }
];
const bookings = ref<ScheduleEvent[]>([
    { id: 'k1', title: 'Onboarding', start: at(0, 9), end: at(0, 12), resourceId: 'a' },
    { id: 'k2', title: 'Interview', start: at(0, 10), end: at(0, 11), resourceId: 'b' },
    { id: 'k3', title: 'Interview', start: at(0, 10, 30), end: at(0, 11, 30), resourceId: 'b' },
    { id: 'k4', title: 'Workshop', start: at(0, 13), end: at(0, 17), resourceId: 'c' },
    { id: 'k5', title: 'Recording', start: at(0, 8), end: at(0, 10), resourceId: 'd' },
    { id: 'k6', title: 'Maintenance', start: day(0), end: day(1), allDay: true, resourceId: 'd' }
]);

function rebook(change: ScheduleEventChange) {
    bookings.value = bookings.value.map((e) => (e === change.event ? { ...e, start: change.start, end: change.end, resourceId: change.resourceId } : e));
}
</script>

<template>
    <Schedule v-model:view="view" :views="['timeline', 'week']" :resources="resources" :events="bookings" min-time="07:00" max-time="20:00" scroll-height="20rem" style="width: 100%" @event-change="rebook">
        <template #resource="{ resource }">
            <span style="display: flex; align-items: center; gap: 0.5rem">
                <span :style="{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: resource.color ?? 'var(--vt-chart-1)' }" />
                {{ resource.title }}
            </span>
        </template>
    </Schedule>
</template>
