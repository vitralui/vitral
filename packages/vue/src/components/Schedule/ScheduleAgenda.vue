<script setup lang="ts">
import { addDays, isSameDay } from '@vitral/core';
import { computed, inject } from 'vue';
import { scheduleKey } from './context';
import ScheduleEventView from './ScheduleEventView.vue';

// The agenda: the days of the range that have something on, each a heading
// over a list of its events, in order. A multi-day event is listed on each of
// its days.

defineOptions({ name: 'VtScheduleAgenda' });

const ctx = inject(scheduleKey)!;
const { part, locale } = ctx;

const groups = computed(() =>
    ctx.days.value
        .map((day) => {
            const end = addDays(day, 1);
            return { day, items: ctx.occurrences.value.filter((o) => o.start < end && o.end > day) };
        })
        .filter((g) => g.items.length > 0)
);
const Empty = () => ctx.slots.empty?.() ?? locale.value.schedule.noEvents;
</script>

<template>
    <div v-bind="part('agenda')">
        <ul v-if="groups.length" v-bind="part('agendaList')">
            <li v-for="group in groups" :key="group.day.getTime()" v-bind="part('agendaDay', { today: isSameDay(group.day, ctx.today.value) })">
                <div role="heading" aria-level="3" v-bind="part('agendaDate')" :aria-current="isSameDay(group.day, ctx.today.value) ? 'date' : undefined">
                    {{ ctx.format(group.day, locale.schedule.dayTitle) }}
                </div>
                <ul v-bind="part('agendaEvents')">
                    <li v-for="occ in group.items" :key="occ.key" v-bind="part('agendaItem')">
                        <ScheduleEventView :occ="occ" variant="list" />
                    </li>
                </ul>
            </li>
        </ul>
        <div v-else v-bind="part('agendaEmpty')"><Empty /></div>
    </div>
</template>
