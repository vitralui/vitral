<script setup lang="ts">
import { Button, Schedule, type ScheduleEvent, type ScheduleEventChange } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const at = (hour: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour);

// Weekends are closed: a move onto one is taken back.
const guarded = ref<ScheduleEvent[]>([{ id: 'g', title: 'Try moving me to a weekend', start: at(11), end: at(12) }]);
function guard(change: ScheduleEventChange) {
    const weekend = change.start.getDay() === 0 || change.start.getDay() === 6;
    if (weekend) {
        change.revert();
        return;
    }
    guarded.value = guarded.value.map((e) => (e === change.event ? { ...e, start: change.start, end: change.end } : e));
}
</script>

<template>
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
</template>
