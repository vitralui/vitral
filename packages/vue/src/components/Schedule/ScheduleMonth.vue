<script setup lang="ts">
import { addDays, formatMessage, isSameDay, layoutDaySpans, visuallyHidden, weekdayOrder } from '@vitral/core';
import { computed, inject, mergeProps } from 'vue';
import { scheduleKey, type Occurrence, type ScheduleCell } from './context';
import ScheduleEventView from './ScheduleEventView.vue';

// The month view: six weeks as rows of day cells. Every event covering a day
// is a bar across the week — a timed one included — packed into rows; a day
// with more than `maxEventsPerDay` shows a "+N more" button that lists them all.

defineOptions({ name: 'VtScheduleMonth' });

const ctx = inject(scheduleKey)!;
const { part, locale } = ctx;

const month = computed(() => addDays(ctx.range.value.start, 15).getMonth());
const weekdays = computed(() => weekdayOrder(ctx.firstDay.value).map((day) => ({ day, short: locale.value.dayNamesShort[day] ?? '', long: locale.value.dayNames[day] ?? '' })));
const max = computed(() => Math.max(1, ctx.props.maxEventsPerDay));

const weeks = computed(() =>
    Array.from({ length: 6 }, (_, w) => {
        const start = addDays(ctx.range.value.start, w * 7);
        const days = Array.from({ length: 7 }, (_, d) => addDays(start, d));
        const end = addDays(start, 7);
        const list = ctx.occurrences.value.filter((o) => o.start < end && o.end > start);
        const spans = layoutDaySpans<Occurrence>(list, (o) => o, start, 7);
        const counts = days.map((_, d) => spans.filter((p) => p.first <= d && p.last >= d).length);
        // A day that overflows gives up its last row to the "+N more" button.
        const limits = counts.map((c) => (c > max.value ? max.value - 1 : max.value));
        const shown = spans.filter((p) => p.row < Math.min(...limits.slice(p.first, p.last + 1)));
        const hidden = days.map((_, d) => counts[d]! - shown.filter((p) => p.first <= d && p.last >= d).length);
        return { start, days, shown, hidden, limits };
    })
);

const cell = (day: Date): ScheduleCell => ({ start: day, span: 1440, allDay: true, resource: 0 });
const isToday = (day: Date) => isSameDay(day, ctx.today.value);
const pct = (n: number) => `${(n * 100).toFixed(4)}%`;
const rowTop = (row: number) => `calc(var(--vt-schedule-month-date-height) + ${row} * (var(--vt-schedule-event-height) + var(--vt-schedule-event-gap)))`;
const spanStyle = (p: { first: number; last: number; row: number }) => ({
    left: pct(p.first / 7),
    width: `calc(${pct((p.last - p.first + 1) / 7)} - var(--vt-schedule-event-gap))`,
    top: rowTop(p.row)
});
const moreStyle = (row: number, day: number) => ({ top: rowTop(row), left: pct(day / 7), width: `calc(${pct(1 / 7)} - var(--vt-schedule-event-gap))` });
</script>

<template>
    <div v-bind="mergeProps(ctx.gridAttrs.value, part('grid', { view: 'month' }))" :style="{ '--vt-schedule-rows': max }">
        <div role="rowgroup" v-bind="part('head')">
            <div role="row" v-bind="part('monthHeadRow')">
                <div v-for="w in weekdays" :key="w.day" role="columnheader" v-bind="part('weekday')">
                    <abbr :title="w.long" aria-hidden="true">{{ w.short }}</abbr>
                    <span :style="visuallyHidden">{{ w.long }}</span>
                </div>
            </div>
        </div>
        <div role="rowgroup" v-bind="part('monthBody')">
            <div v-for="(week, wi) in weeks" :key="week.start.getTime()" role="row" v-bind="part('week')">
                <div
                    v-for="(day, di) in week.days"
                    :key="day.getTime()"
                    role="gridcell"
                    :aria-current="isToday(day) ? 'date' : undefined"
                    v-bind="
                        mergeProps(
                            ctx.cellAttrs(cell(day)),
                            part('monthCell', {
                                today: isToday(day),
                                otherMonth: day.getMonth() !== month,
                                selected: ctx.isSelected(cell(day)),
                                focused: ctx.isFocused(cell(day)),
                                weekend: day.getDay() === 0 || day.getDay() === 6
                            })
                        )
                    "
                >
                    <span :style="visuallyHidden">{{ ctx.cellLabel(cell(day)) }}</span>
                    <span aria-hidden="true" v-bind="part('dateLabel', { today: isToday(day) })">{{ day.getDate() }}</span>
                    <button
                        v-if="week.hidden[di]! > 0"
                        type="button"
                        v-bind="part('moreButton')"
                        :style="moreStyle(week.limits[di]!, di)"
                        :aria-label="formatMessage(locale.schedule.moreLabel, { count: week.hidden[di]!, date: ctx.format(day, locale.schedule.dayTitle) })"
                        aria-haspopup="dialog"
                        @click="ctx.showMore($event, day)"
                    >
                        {{ formatMessage(locale.schedule.more, { count: week.hidden[di]! }) }}
                    </button>
                    <div v-if="di === 0" data-vt-layer v-bind="part('weekLayer')">
                        <ScheduleEventView
                            v-for="p in week.shown"
                            :key="`${p.item.key}-${wi}`"
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
    </div>
</template>
