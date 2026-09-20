<script setup lang="ts">
import {
    addMonths,
    calendarKeyTarget,
    formatDate,
    isDateSelectable,
    isInRange,
    isRangeEnd,
    isSameDay,
    isSameMonth,
    monthGrid,
    normalizeDateRange,
    pressRange,
    previewRange,
    rangeLength,
    startOfDay,
    weekdayOrder,
    type CalendarDay,
    type DateConstraints,
    type DateRange
} from '@vitral/core';
import { daterangeStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useFocusTrap } from '../../composables/useFocusTrap';
import { useOverlay } from '../../composables/useOverlay';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import type { DateRangeEmits, DateRangeProps, DateRangeSlots } from './types';

/**
 * Two dates and the days between them. It is the date picker dialog's pattern
 * with one span instead of one day: a text box, a button that opens a modal
 * calendar, one tabbable day across all the months (roving tabindex), and focus
 * that lives in the dialog while it is open.
 *
 * Two months side by side is the default, because a span that crosses a month
 * boundary is the ordinary case and paging back and forth to pick it is not.
 * `months="1"` shows the same range in one calendar.
 *
 * The first press opens the range and the second closes it, either way round —
 * the ends sort themselves, so dragging backwards needs no thought. While one
 * end is down, the day under the pointer or the keyboard is drawn as the other,
 * so the span is visible before it is committed.
 */

defineOptions({ name: 'VtDateRange', inheritAttrs: false });

const props = withDefaults(defineProps<DateRangeProps>(), {
    unstyled: undefined,
    variant: undefined,
    months: 2,
    // Absent, not false: an unset boolean prop is `false` to Vue, and this one
    // has to tell "left to the number of months" from "asked for off".
    showOtherMonths: undefined,
    separator: '–',
    minDate: null,
    maxDate: null,
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<DateRange>({ default: () => ({ start: null, end: null }) });
const emit = defineEmits<DateRangeEmits>();
defineSlots<DateRangeSlots>();

const { part, config, locale } = useComponent(daterangeStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const dialogId = `${id}-dialog`;

const rootRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const open = ref(false);
const hovered = ref<Date | null>(null);
const focusedDate = ref<Date | null>(null);

const value = computed(() => normalizeDateRange(model.value ?? { start: null, end: null }));
const interactive = computed(() => !props.disabled && !props.readonly);
const count = computed(() => Math.max(1, Math.min(3, Math.round(props.months))));
const pattern = computed(() => props.dateFormat ?? locale.value.dateFormat);
const firstDay = computed(() => props.firstDayOfWeek ?? locale.value.firstDayOfWeek);
const constraints = computed<DateConstraints>(() => ({
    min: props.minDate ?? undefined,
    max: props.maxDate ?? undefined,
    disabledDates: props.disabledDates,
    disabledDays: props.disabledDays
}));
const selectable = (date: Date) => isDateSelectable(date, constraints.value);

/** The leftmost month on show. Every other one follows from it. */
const view = ref(startOfDay(value.value.start ?? new Date()));
watch(
    () => value.value.start,
    (start) => {
        if (start && !open.value) view.value = startOfDay(start);
    }
);

const months = computed(() =>
    Array.from({ length: count.value }, (_, i) => {
        const at = addMonths(view.value, i);
        return {
            key: `${at.getFullYear()}-${at.getMonth()}`,
            date: at,
            title: formatDate(at, 'MMMM yyyy', locale.value),
            weeks: monthGrid(at.getFullYear(), at.getMonth(), firstDay.value)
        };
    })
);

const weekdays = computed(() =>
    weekdayOrder(firstDay.value).map((day) => ({ day, short: locale.value.dayNamesMin[day]!, long: locale.value.dayNames[day]! }))
);

/**
 * What the range looks like right now, which is the chosen one unless a start
 * is down and something is being pointed at or moved towards.
 */
const shown = computed(() => previewRange(value.value, interactive.value ? (hovered.value ?? focusedDate.value) : null));
const previewing = computed(() => !value.value.end && !!shown.value.end);
const nights = computed(() => Math.max(0, rangeLength(value.value) - 1));

const text = computed(() => {
    const { start, end } = value.value;
    if (!start) return '';
    const from = formatDate(start, pattern.value, locale.value);
    return end ? `${from} ${props.separator} ${formatDate(end, pattern.value, locale.value)}` : from;
});

/** The one day that takes the tab stop, across every month on show. */
const activeDate = computed(() => focusedDate.value ?? value.value.start ?? startOfDay(new Date()));

/** Days either side of a month: drawn on a single calendar, left out of several. */
const showOther = computed(() => props.showOtherMonths ?? count.value === 1);
/** A cell that is only there to hold the grid's shape. */
const blank = (day: CalendarDay) => !showOther.value && day.otherMonth;

/**
 * The day the tab stop sits on. The active one, normally — but a day the
 * calendars are only showing as a neighbour now has no cell of its own, so the
 * tab stop falls back to the first of the months on show and the grid stays
 * reachable. It also settles which of two calendars gets the tab stop when a
 * date is drawn in both, which nothing decided before.
 */
const tabDate = computed(() => {
    const active = activeDate.value;
    for (const month of months.value) for (const day of month.weeks.flat()) if (isSameDay(day.date, active) && !blank(day)) return active;
    return months.value[0]?.date ?? active;
});

function dayState(day: CalendarDay) {
    const end = isRangeEnd(day.date, shown.value);
    return {
        end,
        inRange: isInRange(day.date, shown.value) && !end,
        preview: previewing.value,
        today: day.today,
        otherMonth: day.otherMonth,
        disabled: !selectable(day.date)
    };
}

function press(day: CalendarDay, event?: Event) {
    if (!interactive.value || !selectable(day.date)) return;
    focusedDate.value = day.date;
    const next = pressRange(value.value, day.date);
    model.value = next;
    hovered.value = null;
    if (next.start && next.end) {
        emit('rangeSelect', next);
        if (!props.inline) hide();
    }
    if (props.inline || !next.end) focusActiveDay();
    void event;
}

function clear() {
    model.value = { start: null, end: null };
    emit('clear');
}

function setView(date: Date) {
    const at = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
    if (isSameMonth(at, view.value)) return;
    view.value = at;
    emit('monthChange', { month: at.getMonth(), year: at.getFullYear() });
}

function page(step: number) {
    setView(addMonths(view.value, step));
}

async function focusActiveDay() {
    await nextTick();
    const root = props.inline ? rootRef.value : panelRef.value;
    root?.querySelector<HTMLElement>('[tabindex="0"][data-date]')?.focus();
}

function onGridKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const day = months.value.flatMap((m) => m.weeks.flat()).find((d) => isSameDay(d.date, activeDate.value));
        if (day) press(day, event);
        return;
    }
    const target = calendarKeyTarget(activeDate.value, event.key, { shiftKey: event.shiftKey, firstDayOfWeek: firstDay.value, constraints: constraints.value });
    if (!target) return;
    event.preventDefault();
    focusedDate.value = target;
    // Keep the moving day on screen: it leads the months rather than the months
    // trapping it.
    const last = addMonths(view.value, count.value - 1);
    if (target < view.value) setView(target);
    else if (target > new Date(last.getFullYear(), last.getMonth() + 1, 0)) setView(addMonths(target, -(count.value - 1)));
    focusActiveDay();
}

// ---- the popup ------------------------------------------------------------

useOverlay({
    anchor: buttonRef,
    overlay: computed(() => (props.inline ? null : panelRef.value)),
    placement: () => props.placement,
    onEscape: () => hide(true),
    onPointerDownOutside: () => hide()
});
useFocusTrap(computed(() => (props.inline ? null : panelRef.value)));

function show() {
    if (!interactive.value || open.value) return;
    if (value.value.start) view.value = startOfDay(new Date(value.value.start.getFullYear(), value.value.start.getMonth(), 1));
    open.value = true;
    focusedDate.value = value.value.start ?? null;
    emit('show');
    focusActiveDay();
}

function hide(returnFocus = false) {
    if (!open.value) return;
    open.value = false;
    hovered.value = null;
    emit('hide');
    if (returnFocus) buttonRef.value?.focus();
}

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    focused: open.value
}));

defineExpose({ show, hide, clear });
</script>

<template>
    <div v-if="inline" ref="rootRef" v-bind="mergeProps(rootAttrs, part('panel', { inline: true, disabled }))">
        <div v-bind="part('months')">
            <div v-for="(month, i) in months" :key="month.key" v-bind="part('month')">
                <div v-bind="part('header')">
                    <Button v-if="i === 0" :aria-label="locale.aria.previousMonth" variant="text" severity="secondary" size="small" :disabled="disabled" v-bind="part('prevButton')" @click="page(-1)">
                        <Icon icon="chevronLeft" />
                    </Button>
                    <span v-bind="part('title')">{{ month.title }}</span>
                    <Button
                        v-if="i === months.length - 1"
                        :aria-label="locale.aria.nextMonth"
                        variant="text"
                        severity="secondary"
                        size="small"
                        :disabled="disabled"
                        v-bind="part('nextButton')"
                        @click="page(1)"
                    >
                        <Icon icon="chevronRight" />
                    </Button>
                </div>
                <table role="grid" :aria-label="month.title" v-bind="part('grid')" @keydown="onGridKeydown" @mouseleave="hovered = null">
                    <thead>
                        <tr v-bind="part('weekdays')">
                            <th v-for="w in weekdays" :key="w.day" scope="col" :abbr="w.long" v-bind="part('weekday')">{{ w.short }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(week, w) in month.weeks" :key="w" v-bind="part('week')">
                            <template v-for="day in week" :key="day.date.getTime()">
                                <td v-if="blank(day)" v-bind="part('day', { blank: true })" />
                                <td
                                    v-else
                                    :tabindex="!disabled && isSameDay(day.date, tabDate) ? 0 : -1"
                                    :aria-selected="dayState(day).end || dayState(day).inRange ? 'true' : 'false'"
                                    :aria-current="day.today ? 'date' : undefined"
                                    :aria-disabled="disabled || dayState(day).disabled ? 'true' : undefined"
                                    :data-date="`${day.year}-${day.month + 1}-${day.day}`"
                                    v-bind="part('day', dayState(day))"
                                    @click="press(day, $event)"
                                    @mouseenter="hovered = day.date"
                                >
                                    <span v-bind="part('dayLabel')">
                                        <slot name="date" :date="day.date" :day="day.day" :today="day.today" :in-range="dayState(day).inRange" :end="dayState(day).end" :disabled="dayState(day).disabled" :other-month="day.otherMonth">
                                            {{ day.day }}
                                        </slot>
                                    </span>
                                </td>
                            </template>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-if="$slots.footer || showClearButton" v-bind="part('footer')">
            <slot name="footer" :range="value" :nights="nights" :clear="clear">
                <Button :label="locale.clear" severity="secondary" variant="text" size="small" :disabled="disabled || !value.start" @click="clear" />
            </slot>
        </div>
    </div>

    <div v-else ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))">
        <input
            v-bind="mergeProps(controlAttrs, part('input'))"
            :value="text"
            :placeholder="placeholder"
            :disabled="disabled"
            readonly
            :aria-invalid="invalid ? 'true' : undefined"
            @click="show"
        />
        <button
            ref="buttonRef"
            type="button"
            :aria-label="locale.aria.chooseDate"
            :aria-expanded="open"
            :aria-controls="open ? dialogId : undefined"
            aria-haspopup="dialog"
            :disabled="disabled"
            v-bind="part('dropdown')"
            @click="open ? hide(true) : show()"
        >
            <Icon icon="calendar" />
        </button>

        <Teleport :to="overlayTarget">
            <div v-if="open" :id="dialogId" ref="panelRef" role="dialog" aria-modal="true" :aria-label="locale.aria.chooseDate" v-bind="part('panel', { disabled })">
                <div v-bind="part('months')">
                    <div v-for="(month, i) in months" :key="month.key" v-bind="part('month')">
                        <div v-bind="part('header')">
                            <Button v-if="i === 0" :aria-label="locale.aria.previousMonth" variant="text" severity="secondary" size="small" v-bind="part('prevButton')" @click="page(-1)">
                                <Icon icon="chevronLeft" />
                            </Button>
                            <span v-bind="part('title')">{{ month.title }}</span>
                            <Button v-if="i === months.length - 1" :aria-label="locale.aria.nextMonth" variant="text" severity="secondary" size="small" v-bind="part('nextButton')" @click="page(1)">
                                <Icon icon="chevronRight" />
                            </Button>
                        </div>
                        <table role="grid" :aria-label="month.title" v-bind="part('grid')" @keydown="onGridKeydown" @mouseleave="hovered = null">
                            <thead>
                                <tr v-bind="part('weekdays')">
                                    <th v-for="w in weekdays" :key="w.day" scope="col" :abbr="w.long" v-bind="part('weekday')">{{ w.short }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(week, w) in month.weeks" :key="w" v-bind="part('week')">
                                    <template v-for="day in week" :key="day.date.getTime()">
                                        <td v-if="blank(day)" v-bind="part('day', { blank: true })" />
                                        <td
                                            v-else
                                            :tabindex="isSameDay(day.date, tabDate) ? 0 : -1"
                                            :aria-selected="dayState(day).end || dayState(day).inRange ? 'true' : 'false'"
                                            :aria-current="day.today ? 'date' : undefined"
                                            :aria-disabled="dayState(day).disabled ? 'true' : undefined"
                                            :data-date="`${day.year}-${day.month + 1}-${day.day}`"
                                            v-bind="part('day', dayState(day))"
                                            @click="press(day, $event)"
                                            @mouseenter="hovered = day.date"
                                        >
                                            <span v-bind="part('dayLabel')">
                                                <slot name="date" :date="day.date" :day="day.day" :today="day.today" :in-range="dayState(day).inRange" :end="dayState(day).end" :disabled="dayState(day).disabled" :other-month="day.otherMonth">
                                                    {{ day.day }}
                                                </slot>
                                            </span>
                                        </td>
                                    </template>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div v-if="$slots.footer || showClearButton" v-bind="part('footer')">
                    <slot name="footer" :range="value" :nights="nights" :clear="clear">
                        <Button :label="locale.clear" severity="secondary" variant="text" size="small" :disabled="!value.start" @click="clear" />
                    </slot>
                </div>
            </div>
        </Teleport>
    </div>
</template>
