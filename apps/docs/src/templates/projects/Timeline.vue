<script setup lang="ts">
import { Avatar, Schedule, SelectButton, Tag, type ScheduleEvent, type ScheduleEventChange, type ScheduleViewName } from '@vitral/vue';
import { computed, ref } from 'vue';
import { photo } from '../kit/format';
import { memberOf, tasks, team } from './data';

const today = new Date();
today.setHours(0, 0, 0, 0);
const day = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);

const view = ref<ScheduleViewName>('timeline');
const date = ref(day(-2));
const span = ref(14);

const resources = team.map((member) => ({ id: member.id, title: member.name, color: member.color }));
const events = computed<ScheduleEvent[]>(() =>
    tasks.value.map((task) => ({
        id: task.id,
        title: task.title,
        start: day(task.start),
        end: day(task.start + task.length),
        resourceId: task.owner,
        color: memberOf(task.owner).color,
        done: task.status === 'done'
    }))
);

function move(change: ScheduleEventChange) {
    const task = tasks.value.find((entry) => entry.id === change.event.id);
    if (!task) return;
    task.start = Math.round((change.start.getTime() - today.getTime()) / 86400000);
    task.length = Math.max(1, Math.round((change.end.getTime() - change.start.getTime()) / 86400000));
    if (change.resourceId) task.owner = String(change.resourceId);
}

const load = computed(() =>
    team.map((member) => ({ member, points: tasks.value.filter((task) => task.owner === member.id && task.status !== 'done').reduce((sum, task) => sum + task.points, 0) }))
);
</script>

<template>
    <div class="tp-head">
        <div>
            <h1 class="tp-h1">Timeline</h1>
            <p class="tp-muted">Drag a bar to reschedule it or hand it to someone else.</p>
        </div>
        <SelectButton
            v-model="span"
            :options="[
                { label: '2 weeks', value: 14 },
                { label: '4 weeks', value: 28 }
            ]"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            label="Range"
            size="small"
        />
    </div>

    <div class="tp-card tp-card-schedule">
        <Schedule
            v-model:view="view"
            v-model:date="date"
            :views="['timeline']"
            :resources="resources"
            :events="events"
            :timeline-days="span"
            :timeline-slot-duration="1440"
            :snap-duration="1440"
            :now-indicator="false"
            :business-hours="false"
            editable
            scroll-height="26rem"
            class="tp-schedule tp-timeline-schedule"
            scroll-time="00:00"
            @event-change="move"
        >
            <template #event="{ event }">
                <span class="tp-bar-title">{{ event.title }}</span>
            </template>
            <template #resource="{ resource }">
                <span class="tp-person">
                    <Avatar
                        :image="memberOf(String(resource.id)).photo ? photo(memberOf(String(resource.id)).photo!, 64, 64) : undefined"
                        :label="memberOf(String(resource.id)).photo ? undefined : memberOf(String(resource.id)).initials"
                        alt=""
                        shape="circle"
                    />
                    <span>{{ resource.title }}</span>
                </span>
            </template>
        </Schedule>
    </div>

    <section aria-labelledby="timeline-load">
        <h2 id="timeline-load" class="tp-h2">Open work</h2>
        <ul class="tp-grid tp-load">
            <li v-for="entry in load" :key="entry.member.id" class="tp-card tp-row tp-row-between">
                <span class="tp-person">
                    <span class="tp-dot" :style="{ background: entry.member.color }" aria-hidden="true" />
                    <b>{{ entry.member.name }}</b>
                </span>
                <Tag :value="`${entry.points} pts`" :severity="entry.points > 12 ? 'warn' : 'secondary'" />
            </li>
        </ul>
    </section>
</template>
