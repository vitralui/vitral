<script setup lang="ts">
import { Button, Dialog, Schedule, StackPanel, Tag, type ScheduleEvent, type ScheduleEventChange, type ScheduleOccurrenceInfo, type ScheduleSelection, type ScheduleViewName } from '@vitral/vue';
import { computed, ref } from 'vue';

const today = new Date();
const at = (dayOffset: number, hour: number, minute = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);
const day = (dayOffset: number) => at(dayOffset, 0);

const events = ref<ScheduleEvent[]>([
    { id: 1, title: 'Standup', start: at(-today.getDay() + 1, 9), end: at(-today.getDay() + 1, 9, 15), recurrence: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', color: 'var(--vt-chart-4)' },
    { id: 2, title: 'Design review', start: at(0, 10), end: at(0, 11, 30) },
    { id: 3, title: 'Pairing', start: at(0, 10, 30), end: at(0, 12) },
    { id: 4, title: 'Lunch with Ana', start: at(1, 12, 30), end: at(1, 13, 30), color: 'var(--vt-chart-3)' },
    { id: 5, title: 'Release', start: day(2), end: day(4), allDay: true, color: 'var(--vt-chart-2)' },
    { id: 6, title: 'Planning', start: at(-1, 14), end: at(-1, 16) },
    { id: 7, title: 'Board meeting', start: at(3, 15), end: at(3, 16), editable: false, color: 'var(--vt-chart-6)' },
    { id: 8, title: 'Payroll', start: new Date(today.getFullYear(), today.getMonth(), 1, 8), recurrence: 'FREQ=MONTHLY;BYMONTHDAY=1,-1', allDay: true, color: 'var(--vt-chart-5)' }
]);

let nextId = 100;
const view = ref<ScheduleViewName>('month');

const opened = ref<{ event: ScheduleEvent; occurrence: ScheduleOccurrenceInfo } | null>(null);
const details = computed(() => {
    const current = opened.value;
    if (!current) return null;
    const { event, occurrence } = current;
    const when = occurrence.allDay
        ? occurrence.start.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
        : `${occurrence.start.toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} – ${occurrence.end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    return { title: event.title, when, recurring: occurrence.recurring, editable: event.editable !== false };
});

// Applies a change: a single event is updated; one occurrence of a series is
// split off as an event of its own and left out of the series.
function apply(change: ScheduleEventChange) {
    const { event, occurrence, start, end, allDay, resourceId } = change;
    if (occurrence.recurring) {
        events.value = [
            ...events.value.map((e) => (e === event ? { ...e, exdate: [...(e.exdate ?? []), occurrence.start] } : e)),
            { ...event, id: nextId++, recurrence: null, exdate: undefined, start, end, allDay, resourceId }
        ];
    } else {
        events.value = events.value.map((e) => (e === event ? { ...e, start, end, allDay, resourceId } : e));
    }
}

function create(selection: ScheduleSelection) {
    events.value = [...events.value, { id: nextId++, title: 'New event', start: selection.start, end: selection.end, allDay: selection.allDay, resourceId: selection.resourceId }];
}
</script>

<template>
    <Schedule
        v-model:view="view"
        :events="events"
        :max-events-per-day="2"
        style="width: 100%"
        @event-change="apply"
        @select="create"
        @event-click="opened = { event: $event.event, occurrence: $event.occurrence }"
    />

    <Dialog :visible="!!opened" modal :header="details?.title" :style="{ width: 'min(26rem, 92vw)' }" @update:visible="opened = null">
        <StackPanel v-if="details" spacing="0.5rem">
            <p style="margin: 0">{{ details.when }}</p>
            <StackPanel orientation="horizontal" spacing="0.625rem" align="center" wrap>
                <Tag v-if="details.recurring" value="Repeats" severity="info" />
                <Tag v-if="!details.editable" value="Locked" severity="secondary" />
            </StackPanel>
        </StackPanel>
        <template #footer>
            <Button label="Close" severity="secondary" variant="text" @click="opened = null" />
        </template>
    </Dialog>
</template>
