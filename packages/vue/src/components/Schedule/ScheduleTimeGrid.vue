<script setup lang="ts">
import { addMinutes, fractionOf, isSameDay, layoutDaySpans, layoutTimedEvents, visuallyHidden } from '@vitral/core';
import { computed, inject, mergeProps, ref, watch } from 'vue';
import { scheduleKey, type Occurrence, type ScheduleCell } from './context';
import ScheduleEventView from './ScheduleEventView.vue';

// The week and day views: a grid whose rows are time slots and whose columns
// are days, under a header row and an all-day row. Each layer of events is
// drawn inside the first cell of the row (or rows) it covers, positioned over
// them, so the grid holds only rows and cells and the events stay in it.

defineOptions({ name: 'VtScheduleTimeGrid' });

const ctx = inject(scheduleKey)!;
const { part, locale } = ctx;
const bodyRef = ref<HTMLElement | null>(null);
watch(bodyRef, (el) => ctx.registerScroller(el), { flush: 'post' });

const days = ctx.days;
const columns = computed(() => ({ gridTemplateColumns: `var(--vt-schedule-gutter-width) repeat(${days.value.length}, minmax(0, 1fr))` }));

const slots = computed(() => {
    const out: number[] = [];
    for (let m = ctx.minMinutes.value; m < ctx.maxMinutes.value; m += ctx.slotMinutes.value) out.push(m);
    return out;
});
const bodyHeight = computed(() => `calc(${slots.value.length} * var(--vt-schedule-slot-height))`);

const cellOf = (day: Date, minutes: number): ScheduleCell => ({ start: addMinutes(day, minutes), span: ctx.slotMinutes.value, allDay: false, resource: 0 });
const dayCell = (day: Date): ScheduleCell => ({ start: day, span: 1440, allDay: true, resource: 0 });

const allDay = computed(() => layoutDaySpans(ctx.occurrences.value.filter((o) => o.allDay), (o) => o, days.value[0]!, days.value.length));
const allDayRows = computed(() => allDay.value.reduce((n, p) => Math.max(n, p.row + 1), 0));

const timed = computed(() =>
    days.value.map((day) => {
        const from = addMinutes(day, ctx.minMinutes.value);
        const to = addMinutes(day, ctx.maxMinutes.value);
        const list = ctx.occurrences.value.filter((o) => !o.allDay && o.start < to && o.end > from);
        return layoutTimedEvents<Occurrence>(list, (o) => o, from, to, Math.min(15, ctx.slotMinutes.value));
    })
);

function nowAt(day: Date) {
    if (!ctx.props.nowIndicator || !isSameDay(day, ctx.now.value)) return null;
    return fractionOf(ctx.now.value, addMinutes(day, ctx.minMinutes.value), addMinutes(day, ctx.maxMinutes.value));
}

const pct = (n: number) => `${(n * 100).toFixed(4)}%`;
const layerStyle = (index: number) => ({
    left: `calc(var(--vt-schedule-gutter-width) + (100% - var(--vt-schedule-gutter-width)) * ${index} / ${days.value.length})`,
    width: `calc((100% - var(--vt-schedule-gutter-width)) / ${days.value.length})`,
    height: bodyHeight.value
});
const spanStyle = (p: { first: number; last: number; row: number }) => ({
    left: pct(p.first / days.value.length),
    width: `calc(${pct((p.last - p.first + 1) / days.value.length)} - var(--vt-schedule-event-gap))`,
    top: `calc(${p.row} * (var(--vt-schedule-event-height) + var(--vt-schedule-event-gap)))`
});
const timedStyle = (p: { top: number; height: number; column: number; columns: number; span: number }) => ({
    top: pct(p.top),
    height: pct(p.height),
    left: pct(p.column / p.columns),
    width: `calc(${pct(p.span / p.columns)} - var(--vt-schedule-event-gap))`
});
const hourLabel = (minutes: number) => ctx.formatTime(addMinutes(days.value[0]!, minutes));
const isToday = (day: Date) => isSameDay(day, ctx.today.value);
const weekend = (day: Date) => day.getDay() === 0 || day.getDay() === 6;
const canOpenDay = computed(() => days.value.length > 1 && ctx.views.value.includes('day'));
</script>

<template>
    <div v-bind="mergeProps(ctx.gridAttrs.value, part('grid', { view: ctx.view.value }))">
        <div role="rowgroup" v-bind="part('head')">
            <div role="row" v-bind="part('headRow')" :style="columns">
                <div role="columnheader" v-bind="part('corner')"><span :style="visuallyHidden">{{ locale.schedule.time }}</span></div>
                <div v-for="day in days" :key="day.getTime()" role="columnheader" :aria-current="isToday(day) ? 'date' : undefined" v-bind="part('dayHeader', { today: isToday(day), weekend: weekend(day) })">
                    <button v-if="canOpenDay" type="button" v-bind="part('dayLink')" :aria-label="ctx.format(day, locale.schedule.dayTitle)" @click="ctx.gotoDay(day)">
                        {{ ctx.format(day, locale.schedule.dayHeader) }}
                    </button>
                    <template v-else>
                        <span aria-hidden="true">{{ ctx.format(day, locale.schedule.dayHeader) }}</span>
                        <span :style="visuallyHidden">{{ ctx.format(day, locale.schedule.dayTitle) }}</span>
                    </template>
                </div>
            </div>
            <div role="row" v-bind="part('allDayRow')" :style="{ ...columns, '--vt-schedule-rows': Math.max(1, allDayRows) }">
                <div role="rowheader" v-bind="part('gutter', { allDay: true })">{{ locale.schedule.allDay }}</div>
                <div
                    v-for="(day, i) in days"
                    :key="day.getTime()"
                    role="gridcell"
                    :aria-label="`${ctx.cellLabel(dayCell(day))}, ${locale.schedule.allDay}`"
                    v-bind="mergeProps(ctx.cellAttrs(dayCell(day)), part('allDayCell', { today: isToday(day), selected: ctx.isSelected(dayCell(day)), focused: ctx.isFocused(dayCell(day)) }))"
                >
                    <div v-if="i === 0" data-vt-layer v-bind="part('allDayLayer')">
                        <ScheduleEventView
                            v-for="p in allDay"
                            :key="p.item.key"
                            :occ="p.item"
                            variant="span"
                            :continues-before="p.continuesBefore"
                            :continues-after="p.continuesAfter"
                            :resize="p.continuesAfter ? null : 'end'"
                            :style="spanStyle(p)"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div ref="bodyRef" role="rowgroup" v-bind="part('body')" :style="{ maxHeight: ctx.props.scrollHeight }">
            <div v-for="(minutes, si) in slots" :key="minutes" role="row" v-bind="part('slotRow', { hour: minutes % 60 === 0 })" :style="columns">
                <div role="rowheader" v-bind="part('gutter', { hour: minutes % 60 === 0 })">
                    <span v-if="minutes % 60 === 0 && si > 0" aria-hidden="true" v-bind="part('hourLabel')">{{ hourLabel(minutes) }}</span>
                    <span :style="visuallyHidden">{{ hourLabel(minutes) }}</span>
                </div>
                <div
                    v-for="(day, di) in days"
                    :key="day.getTime()"
                    role="gridcell"
                    :aria-label="ctx.cellLabel(cellOf(day, minutes))"
                    v-bind="
                        mergeProps(ctx.cellAttrs(cellOf(day, minutes)), part('slot', {
                            business: ctx.isBusiness(cellOf(day, minutes).start, addMinutes(cellOf(day, minutes).start, ctx.slotMinutes.value)),
                            today: isToday(day),
                            hour: minutes % 60 === 0,
                            selected: ctx.isSelected(cellOf(day, minutes)),
                            focused: ctx.isFocused(cellOf(day, minutes))
                        }))
                    "
                >
                    <div v-if="si === 0" data-vt-layer v-bind="part('dayLayer')" :style="layerStyle(di)">
                        <ScheduleEventView
                            v-for="p in timed[di]"
                            :key="p.item.key"
                            :occ="p.item"
                            variant="timed"
                            :continues-before="p.clippedStart"
                            :continues-after="p.clippedEnd"
                            :resize="p.clippedEnd ? null : 'bottom'"
                            :style="timedStyle(p)"
                        />
                        <div v-if="nowAt(day) !== null" aria-hidden="true" v-bind="part('now')" :style="{ top: pct(nowAt(day)!) }" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

