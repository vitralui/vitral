<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Schedule',
    category: 'Data',
    description:
        'A calendar and scheduler: month, week, day, agenda and a timeline by resource. Drag events to move them and their edge to resize them — or use Alt with the arrow keys (Alt+Shift for the end) — and drag across empty time to pick a range, or Shift with the arrows. Recurring events take an RRULE. Dates are local: an application working in another time zone converts on the way in and out.'
};
</script>

<script setup lang="ts">
import { Button, Schedule, type ScheduleEvent, type ScheduleEventChange, type ScheduleSelection, type ScheduleViewName } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
const log = ref('Move, resize or select something.');

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
    log.value = `${event.title}: ${start.toLocaleString()} → ${end.toLocaleString()} (${change.kind}, ${change.via})`;
}

function create(selection: ScheduleSelection) {
    events.value = [...events.value, { id: nextId++, title: 'New event', start: selection.start, end: selection.end, allDay: selection.allDay, resourceId: selection.resourceId }];
    log.value = `Created ${selection.start.toLocaleString()} → ${selection.end.toLocaleString()}`;
}

const view = ref<ScheduleViewName>('week');
const date = ref(day(0));
const monthView = ref<ScheduleViewName>('month');
const timelineView = ref<ScheduleViewName>('timeline');

// Weekends are closed: a move onto one is taken back.
const guarded = ref<ScheduleEvent[]>([{ id: 'g', title: 'Try moving me to a weekend', start: at(0, 11), end: at(0, 12) }]);
function guard(change: ScheduleEventChange) {
    const weekend = change.start.getDay() === 0 || change.start.getDay() === 6;
    if (weekend) {
        change.revert();
        log.value = 'Refused: weekends are closed.';
        return;
    }
    guarded.value = guarded.value.map((e) => (e === change.event ? { ...e, start: change.start, end: change.end } : e));
}

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
    <DemoSection title="Week" description="Business hours are shaded; overlapping events share the column; the red line is now. The standup repeats every weekday, payroll on the first and last of the month.">
        <Schedule v-model:view="view" v-model:date="date" :events="events" scroll-time="08:00" style="width: 100%" @event-change="apply" @select="create" />
        <span class="demo-hint">{{ log }}</span>
    </DemoSection>

    <DemoSection title="Month" description="Events run across the days they cover; a busy day shows “+N more”, which opens the full list.">
        <Schedule v-model:view="monthView" :events="events" :max-events-per-day="2" style="width: 100%" @event-change="apply" @select="create" />
    </DemoSection>

    <DemoSection title="Agenda" description="The next two weeks as a list, day by day.">
        <Schedule view="agenda" :views="['agenda']" :agenda-days="14" :events="events" style="width: 100%" />
    </DemoSection>

    <DemoSection title="Timeline by resource" description="Rooms as rows and time across. Drag a booking to another room, or press Alt with Up and Down.">
        <Schedule v-model:view="timelineView" :views="['timeline', 'week']" :resources="resources" :events="bookings" min-time="07:00" max-time="20:00" scroll-height="20rem" style="width: 100%" @event-change="rebook">
            <template #resource="{ resource }">
                <span style="display: flex; align-items: center; gap: 0.5rem">
                    <span :style="{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: resource.color ?? 'var(--vt-chart-1)' }" />
                    {{ resource.title }}
                </span>
            </template>
        </Schedule>
    </DemoSection>

    <DemoSection title="Custom toolbar, content and revert" description="The toolbar and the event content are slots. Hours run 08:00–18:00 in 15-minute slots, and a move onto a weekend is reverted.">
        <Schedule :events="guarded" view="week" :slot-duration="15" min-time="08:00" max-time="18:00" scroll-height="24rem" :hour12="false" style="width: 100%" @event-change="guard">
            <template #toolbar="{ title, prev, next, today: goToday }">
                <div style="display: flex; align-items: center; gap: 0.5rem">
                    <Button icon="chevronLeft" aria-label="Previous week" variant="outlined" size="small" @click="prev" />
                    <Button label="This week" variant="outlined" size="small" @click="goToday" />
                    <Button icon="chevronRight" aria-label="Next week" variant="outlined" size="small" @click="next" />
                    <strong style="margin-inline-start: 0.5rem">{{ title }}</strong>
                </div>
            </template>
            <template #event="{ event, timeText }">
                <strong>{{ event.title }}</strong>
                <small>{{ timeText }}</small>
            </template>
        </Schedule>
    </DemoSection>
</template>
