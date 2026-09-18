<script setup lang="ts">
import { addMinutes, fractionOf, isSameDay, layoutLanes, visuallyHidden } from '@vitral/core';
import { computed, inject, mergeProps, ref, watch } from 'vue';
import { scheduleKey, type Occurrence, type ScheduleCell } from './context';
import ScheduleEventView from './ScheduleEventView.vue';

// The timeline: one row per resource, time running across. A row grows to
// fit the lanes its overlapping events need; its events are drawn inside its
// first time cell, over the whole row.

defineOptions({ name: 'VtScheduleTimeline' });

const ctx = inject(scheduleKey)!;
const { part, locale } = ctx;
const scrollRef = ref<HTMLElement | null>(null);
watch(scrollRef, (el) => ctx.registerScroller(el), { flush: 'post' });

const slots = computed(() => {
    const out: { day: Date; minutes: number; start: Date }[] = [];
    for (const day of ctx.days.value) {
        for (let m = ctx.minMinutes.value; m < ctx.maxMinutes.value; m += ctx.timelineSlotMinutes.value) out.push({ day, minutes: m, start: addMinutes(day, m) });
    }
    return out;
});
const columns = computed(() => ({ gridTemplateColumns: `var(--vt-schedule-timeline-resource-width) repeat(${slots.value.length}, minmax(var(--vt-schedule-timeline-slot-width), 1fr))` }));
const multiDay = computed(() => ctx.days.value.length > 1);

// Hidden hours split the axis per day; the layout runs on a continuous axis
// made of the visible stretches laid end to end.
const perDay = computed(() => ctx.maxMinutes.value - ctx.minMinutes.value);
function axis(date: Date, clampEnd: boolean): number {
    const days = ctx.days.value;
    const first = days[0]!;
    let index = days.findIndex((d) => isSameDay(d, date));
    if (index < 0) return date < first ? 0 : days.length * perDay.value;
    const minutes = (date.getTime() - addMinutes(days[index]!, 0).getTime()) / 60_000;
    let within = Math.min(Math.max(minutes - ctx.minMinutes.value, 0), perDay.value);
    if (clampEnd && within === 0 && minutes <= ctx.minMinutes.value && index > 0) {
        index -= 1;
        within = perDay.value;
    }
    return index * perDay.value + within;
}
const origin = new Date(0);
const toAxis = (o: Occurrence) => ({ start: new Date(axis(o.start, false) * 60_000), end: new Date(axis(o.end, true) * 60_000) });
const axisEnd = computed(() => new Date(ctx.days.value.length * perDay.value * 60_000));

const rows = computed(() =>
    ctx.resources.value.map((resource) => {
        const list = ctx.occurrences.value.filter((o) => o.resourceId === resource.id && o.start < ctx.range.value.end && o.end > ctx.range.value.start);
        const placed = layoutLanes<Occurrence>(list, toAxis, origin, axisEnd.value).filter((p) => p.width > 0);
        return { resource, placed, lanes: placed.reduce((n, p) => Math.max(n, p.lane + 1), 1) };
    })
);

const cellOf = (slot: { start: Date }, resource: number): ScheduleCell => ({ start: slot.start, span: ctx.timelineSlotMinutes.value, allDay: false, resource });
const pct = (n: number) => `${(n * 100).toFixed(4)}%`;
const eventStyle = (p: { left: number; width: number; lane: number }) => ({
    left: pct(p.left),
    width: `calc(${pct(p.width)} - var(--vt-schedule-event-gap))`,
    top: `calc(var(--vt-schedule-timeline-row-padding) + ${p.lane} * (var(--vt-schedule-event-height) + var(--vt-schedule-event-gap)))`
});
const nowLeft = computed(() => {
    if (!ctx.props.nowIndicator) return null;
    const now = ctx.now.value;
    if (!ctx.days.value.some((d) => isSameDay(d, now))) return null;
    const minutes = (now.getHours() * 60 + now.getMinutes()) - ctx.minMinutes.value;
    if (minutes < 0 || minutes >= perDay.value) return null;
    return fractionOf(new Date(axis(now, false) * 60_000), origin, axisEnd.value);
});
const slotLabel = (slot: { day: Date; minutes: number; start: Date }) => ctx.formatTime(slot.start);
const firstOfDay = (slot: { minutes: number }) => slot.minutes === ctx.minMinutes.value;
</script>

<template>
    <div ref="scrollRef" v-bind="mergeProps(ctx.gridAttrs.value, part('grid', { view: 'timeline' }))" :style="{ maxHeight: ctx.props.scrollHeight }">
        <div role="rowgroup" v-bind="part('timelineHead')">
            <div role="row" v-bind="part('headRow')" :style="columns">
                <div role="columnheader" v-bind="part('resourceHeader')">{{ locale.schedule.resources }}</div>
                <div v-for="slot in slots" :key="slot.start.getTime()" role="columnheader" v-bind="part('slotHeader', { dayStart: firstOfDay(slot) })">
                    <span v-if="multiDay && firstOfDay(slot)" v-bind="part('slotDay')">{{ ctx.format(slot.day, locale.schedule.dayHeader) }}</span>
                    <span aria-hidden="true">{{ slotLabel(slot) }}</span>
                    <span :style="visuallyHidden">{{ multiDay ? `${ctx.format(slot.day, locale.schedule.dayTitle)}, ` : '' }}{{ slotLabel(slot) }}</span>
                </div>
            </div>
        </div>
        <div role="rowgroup">
            <div
                v-for="(row, ri) in rows"
                :key="row.resource.id"
                role="row"
                v-bind="part('resourceRow')"
                :style="{ ...columns, '--vt-schedule-rows': row.lanes }"
            >
                <div role="rowheader" v-bind="part('resourceCell')">
                    <component :is="() => ctx.slots.resource?.({ resource: row.resource }) ?? row.resource.title" />
                </div>
                <div
                    v-for="(slot, si) in slots"
                    :key="slot.start.getTime()"
                    role="gridcell"
                    :aria-label="ctx.cellLabel(cellOf(slot, ri))"
                    v-bind="
                        mergeProps(
                            ctx.cellAttrs(cellOf(slot, ri)),
                            part('timelineSlot', {
                                business: ctx.isBusiness(slot.start, addMinutes(slot.start, ctx.timelineSlotMinutes.value)),
                                dayStart: firstOfDay(slot),
                                selected: ctx.isSelected(cellOf(slot, ri)),
                                focused: ctx.isFocused(cellOf(slot, ri))
                            })
                        )
                    "
                >
                    <div v-if="si === 0" data-vt-layer v-bind="part('rowLayer')">
                        <ScheduleEventView
                            v-for="p in row.placed"
                            :key="p.item.key"
                            :occ="p.item"
                            variant="lane"
                            :continues-before="p.clippedStart"
                            :continues-after="p.clippedEnd"
                            :resize="p.clippedEnd ? null : 'end'"
                            :style="eventStyle(p)"
                        />
                        <div v-if="nowLeft !== null" aria-hidden="true" v-bind="part('nowVertical')" :style="{ left: pct(nowLeft) }" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
